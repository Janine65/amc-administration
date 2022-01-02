const nodemailer = require("nodemailer");
const path = require("path");
const SwissQRBill = require('swissqrbill')
const {
    Sequelize
} = require("sequelize");
const { Adressen, Journal}  = require('../db');
const fs = require('fs');

module.exports = {

    /**
     * Erstellt eine PDFDatei mit der QR-Rechnung 
     * @param {Request} req 
     * @param {Response} res 
     */
    createQRBill: async function (req, res) {
        console.log("createQRBill");

        const adresse = req.body;
        const sJahr = global.Parameter.get("CLUBJAHR");
    
        const data = {
            currency: "CHF",
            //amount: 30.0,
            additionalInformation: "Rechnungsnummer " + sJahr + "0000" + adresse.mnr,
            av1: "twint/light/02:627a1c3325b04c5cbbbe9afcdfb6501b#6298bbc2451e7f036c9e39e989c20452aa6afd8a#",
            av2: "rn/twint/a~8Hbq5Y6GTd6RWWoWJ3pOsg~s~YbdhuKDqS5edL5KCHuzvtw/rn",
            creditor: {
                name: "Auto-Moto-Club Swissair",
                address: "Breitenrain",
                buildingNumber: "4",
                zip: 8917,
                city: "Oberlunkhofen",
                account: "CH3009000000870661227",
                country: "CH"
            },
            debtor: {
                name: adresse.vorname + " " + adresse.name,
                address: adresse.adresse,
                zip: eval(adresse.plz * 1),
                city: adresse.ort,
                country: adresse.land
            }
        };

        const filename = "AMC-Mitgliederbeitrag-" + sJahr + "-" + adresse.mnr + ".pdf";

        const pdf = new SwissQRBill.PDF(data, "./public/uploads/" + filename, { autoGenerate: false, size: "A4" });
        pdf.info = {
            Title: "Mitgliederrechnung " + sJahr,
            Author: "Auto-Moto-Club Swissair",
            Subject: "Mitgliederrechnung " + sJahr
        }

        // Fit the image within the dimensions
        var img = fs.readFileSync('./public/assets/AMCfarbigKlein.jpg');
        pdf.image(img.buffer, SwissQRBill.utils.mm2pt(140), SwissQRBill.utils.mm2pt(5),
            { fit: [100, 100] });

        const date = new Date();

        pdf.fontSize(12);
        pdf.fillColor("black");
        pdf.font("Helvetica");
        pdf.text(data.creditor.name + "\n" + data.creditor.address + "\n" + data.creditor.zip + " " + data.creditor.city, SwissQRBill.utils.mm2pt(20), SwissQRBill.utils.mm2pt(35), {
            width: SwissQRBill.utils.mm2pt(100),
            align: "left"
        });

        pdf.fontSize(12);
        pdf.font("Helvetica");
        pdf.text(data.debtor.name + "\n" + data.debtor.address + "\n" + data.debtor.zip + " " + data.debtor.city, SwissQRBill.utils.mm2pt(130), SwissQRBill.utils.mm2pt(60), {
            width: SwissQRBill.utils.mm2pt(70),
            height: SwissQRBill.utils.mm2pt(50),
            align: "left"
        });

        pdf.moveDown();
        pdf.fontSize(11);
        pdf.font("Helvetica");
        pdf.text("Oberlunkhofen " + date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear(), {
            width: SwissQRBill.utils.mm2pt(170),
            align: "right"
        });

        pdf.moveDown();
        pdf.fontSize(14);
        pdf.font("Helvetica-Bold");
        pdf.text(data.additionalInformation, SwissQRBill.utils.mm2pt(20), SwissQRBill.utils.mm2pt(100), {
            width: SwissQRBill.utils.mm2pt(140),
            align: "left"
        });

        pdf.moveDown();
        pdf.fontSize(12);
        pdf.fillColor("black");
        pdf.font("Helvetica");

        var text = (adresse.geschlecht == 1 ? "Lieber " : "Liebe ") + adresse.vorname + "\n";
        pdf.text(text, {
            width: SwissQRBill.utils.mm2pt(170),
            align: "left"
        });
        text += global.Parameter.get("RECHNUNG") + '\n';
        pdf.text(`${global.Parameter.get("RECHNUNG")}\n`, {
            width: SwissQRBill.utils.mm2pt(170),
            align: "justify"
        });
        pdf.moveDown();
        text += `Mit liebem Clubgruss\nJanine Franken`;
        pdf.text(`Mit liebem Clubgruss\nJanine Franken`, {
            width: SwissQRBill.utils.mm2pt(170),
            align: "left"
        });
        
        pdf.moveDown();
        pdf.fontSize(10);
        pdf.text(`Bitte beachte, dass für Einzahlungen am Postschalter eine Gebühr von CHF 2.50 erhoben wird. Zahlungen via Twint, Banküberweisung oder E-Finance sind kostenlos.\n`, {
            width: SwissQRBill.utils.mm2pt(170),
            align: "justify",
            oblique: true
        });

        // Fit the image within the dimensions
        img = fs.readFileSync('./public/assets/RNW-TWINT-SWISS-QR-DE.png');
        pdf.image(img.buffer, SwissQRBill.utils.mm2pt(0), SwissQRBill.utils.mm2pt(182), {fit: [SwissQRBill.utils.mm2pt(210), SwissQRBill.utils.mm2pt(10)]});


        pdf.addQRBill();
        pdf.save();
        pdf.end();

        var email_body = "<p>" + text.split("\n").join("</p><p>") + "</p>";

        var email = {
            email_an: adresse.email, email_cc: '', email_bcc: '',
            email_body: email_body,
            email_subject: "Auto-Moto-Club Swissair - Mitgliederrechnung",
            uploadFiles: filename,
            email_signature: "JanineFranken"
        }

        const retVal = await fncSendEmail(email);

        // journal Eintrag erstellen
        var journal = {};
        journal.memo = "Mitgliederbeitrag " + sJahr + " von " + data.debtor.name;
        journal.date = new Date();
        journal.amount = 30;
        journal.from_account = 31;
        journal.to_account = 21;
        journal.receipt = undefined;

        await Journal.create(journal)
            .then(resp => {
                var jahrCost = new Date(resp.date).getFullYear();
                const pathname = global.documents + jahrCost + '/';
                const receipt =  'receipt/' + 'Journal-' + resp.id + '.pdf';
        
                if (fs.existsSync(global.uploads + filename)) {
                    fs.copyFileSync(global.uploads + filename, pathname + receipt);
                    
                    Journal.update({receipt: receipt}, {where: {id: resp.id}})
                        .then(resp2 => {
                            res.json({
                                type: "info",
                                message: "QR-Rechnung erstellt und versendet"
                            });                
                        })
                        .catch(e => console.error(e));						
                } else {
                    res.json({
                        type: "error",
                        message: "QR-Rechnung erstellt und versendet. Konnte File nicht kopieren und an den Journaleintrag hängen"
                    })
                }
            })
            .catch(e => {
                console.error(e);
                res.json({
                    type: "error",
                    message: "QR-Rechnung erstellt und versendet, Journaleintrag fehlt",
                    filename: filename,
                    retVal: retVal,
                    error: e
                });
            });
    },

    sendEmail: async function (req, res) {
        const email = req.body;

        const retVal = await fncSendEmail(email);
        res.json(retVal);

    },
}

async function fncSendEmail(email) {
    console.log(email);
    let email_from = global.gConfig.defaultEmail;
    if (email.email_signature != "") {
        email_from = email.email_signature;
        let email_signature = fs.readFileSync("./public/assets/" + email.email_signature + ".html")
        email.email_body += "<p>" + email_signature + "</p>";
    }
    // console.log(email);
    let emailConfig = global.gConfig[email_from];
    console.log(emailConfig);

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: emailConfig.smtp,
        port: emailConfig.smtp_port,
        secure: true,
        auth: {
            user: emailConfig.smtp_user,
            pass: global.cipher.decrypt(emailConfig.smtp_pwd),
        }
    });

    // verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            return { type: "error", message: "SMTP Connection can not be verified" };
        } else {
            console.log("Server is ready to take our messages");
        }
    });

    let attachments = []

    if (email.uploadFiles) {
        var files = email.uploadFiles.split(',');
        for (let ind2 = 0; ind2 < files.length; ind2++) {
            const file = files[ind2];
            attachments.push({ filename: file, path: path.join(__dirname, '../../uploads/' + file) });
        }
    }

    await transporter.sendMail({
        from: emailConfig.email_from, // sender address
        to: email.email_an, // list of receivers
        cc: email.email_cc,
        bcc: email.email_bcc,
        attachments: attachments,
        subject: email.email_subject, // Subject line
        text: decodeURI(email.email_body), // plain text body
        html: email.email_body, // html body
        dsn: {
            id: 'AMC',
            return: 'headers',
            notify: ['failure', 'delay'],
            recipient: emailConfig.email_from
        }
    }, (err, info) => {
        if (err) {
            console.log(err);
            return err;
        }
        console.log(info);
        transporter.close();
        return info;
    });
}
