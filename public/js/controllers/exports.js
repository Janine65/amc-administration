var db = require("../db");
const {
    Sequelize, Op
} = require("sequelize");
const Meisterschaft = require('../db').Meisterschaft;
const Adressen = require('../db').Adressen;
const Kegelmeister = require('../db').Kegelmeister;
const Clubmeister = require('../db').Clubmeister;

const ExcelJS = require("exceljs");
const cName = "C6";
const cVorname = "C7";
const sFirstRow = 13;

const iFontSizeHeader = 18
const iFontSizeTitel = 14
const iFontSizeRow = 13

module.exports = {

    /**
     * Erstellt ein Excelfile mit dem Journal
     * @param {Request} req 
     * @param {Response} res 
     */
    writeJournal: async function (req, res) {
        console.log("writeAuswertung");
        const sjahr = eval(req.query.jahr * 1);

		var arData = await db.Journal.findAll(
			{
				where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), sjahr),
				include: [
					{ model: db.Account, as: 'fromAccount', required: true, attributes: ['id', 'order', 'name'] },
					{ model: db.Account, as: 'toAccount', required: true, attributes: ['id', 'order', 'name'] }
                ],
                attributes: ['id', 'amount', 'journalNo', 'memo', 'date'],
				order: [
					['journalNo', 'asc'],
					['date', 'asc'],
					['from_account', 'asc'],
				]
			}
		)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });


        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Janine Franken";

        // Force workbook calculation on load
        workbook.calcProperties.fullCalcOnLoad = true;

        var sheet = workbook.addWorksheet("Journal", {
            pageSetup: {
                fitToPage: true,
                fitToHeight: 1,
                fitToWidth: 1,
            },
            properties: {
                defaultRowHeight: 22
            },
            headerFooter: {
                oddHeader: "&18Auto-Moto-Club Swissair",
                oddFooter: "&14Journal " + sjahr
            }
        });


        // Schreibe Bilanzdaten
        setCellValueFormat(sheet, 'B1', "Journal " + sjahr, false, '', { bold: true, size: iFontSizeHeader, name: 'Tahoma' });

        setCellValueFormat(sheet, 'B3', "No", true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(sheet, 'C3', "Date", true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(sheet, 'D3', "From ", true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(sheet, 'E3', "To ", true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(sheet, 'F3', "Booking Text ", true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(sheet, 'G3', "Amount", true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        sheet.getCell('G3').alignment = { horizontal: "right" };

        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        var row = 4;

        for (let index = 0; index < arData.length; index++) {
            const element = arData[index];

            const date = new Date(element.date);
            var dateFmt = date.toLocaleDateString('de-DE', options);   
            
            setCellValueFormat(sheet, 'B' + row, element.journalNo, true, '', {size: iFontSizeRow, name: 'Tahoma' });
            setCellValueFormat(sheet, 'C' + row, dateFmt, true, '', {size: iFontSizeRow, name: 'Tahoma' });
            setCellValueFormat(sheet, 'D' + row, element.fromAccount.order + " " + element.fromAccount.name, true, '', {size: iFontSizeRow, name: 'Tahoma' });
            setCellValueFormat(sheet, 'E' + row, element.toAccount.order + " " + element.toAccount.name, true, '', {size: iFontSizeRow, name: 'Tahoma' });
            setCellValueFormat(sheet, 'F' + row, element.memo, true, '', {size: iFontSizeRow, name: 'Tahoma' });
            setCellValueFormat(sheet, 'G' + row, eval(element.amount * 1), true, '', {size: iFontSizeRow, name: 'Tahoma' });
            sheet.getCell('G' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';

            row++;

        }

        sheet.getColumn('B').width = 8;
        sheet.getColumn('C').width = 18;
        sheet.getColumn('D').width = 35;
        sheet.getColumn('E').width = 35;
        sheet.getColumn('F').width = 50;
        sheet.getColumn('G').width = 18;

        const filename = "Journal-" + sjahr + ".xlsx";
        await workbook.xlsx.writeFile("./public/exports/" + filename)
            .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        return res.json({
            type: "info",
            message: "Excelfile erstellt",
            filename: filename
        });
    },

    /**
   * Erstellt eine Exceldatei mit den Meisterschaftsauswertungen
   * @param {Request} req 
   * @param {Response} res 
   */
    writeAuswertung: async function (req, res) {
        console.log("writeAuswertung");

        var objSave = req.body;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile("./public/exports/Meisterschaft-Vorlage.xlsx");

        // Clubmeisterschaft lesen und exportieren
        var dbMeister = await Clubmeister.findAll({
            where: { jahr: { [Op.eq]: objSave.year } },
            order: [
                ['rang', 'asc']
            ]
        })
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        Promise.resolve(dbMeister)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        var worksheet = workbook.getWorksheet('Clubmeisterschaft');
        worksheet.getCell("A1").value = "Clubmeisterschaft " + objSave.year;
        var row = 5
        for (const meister of dbMeister) {
            // Add a row by contiguous Array (assign to columns A, B & C)
            worksheet.insertRow(row, [meister.rang, meister.punkte, meister.vorname, meister.nachname, meister.mitgliedid, meister.anlaesse, meister.werbungen, meister.mitglieddauer, meister.status], 'i+');
            row++;
        }
        worksheet.getColumn(5).hidden = true;
        worksheet.getColumn(9).hidden = true;
        worksheet.spliceRows(4, 1);

        // Kegelmeisterschaft lesen und exportieren
        dbMeister = await Kegelmeister.findAll({
            where: { jahr: { [Op.eq]: objSave.year } },
            order: [
                ['rang', 'asc']
            ]
        })
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        Promise.resolve(dbMeister)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });


        worksheet = workbook.getWorksheet('Kegelmeisterschaft');
        worksheet.getCell("A1").value = "Kegelmeisterschaft " + objSave.year;
        row = 5
        for (const meister of dbMeister) {
            // Add a row by contiguous Array (assign to columns A, B & C)
            worksheet.insertRow(row, [meister.rang, meister.punkte, meister.vorname, meister.name, meister.mitgliedid, meister.anlaesse, meister.babeli, meister.status], 'i+');
            row++;
        }
        worksheet.getColumn(5).hidden = true;
        worksheet.getColumn(8).hidden = true;
        worksheet.spliceRows(4, 1);

        // Auswertung ohne Vorjahr erstellen
        let qrySelect
        qrySelect = "SELECT CONCAT(date_format(data.datum, '%d.%m.%Y'),' ',data.name) as anlass,";
        qrySelect += " data.teilnehmer, data.gaeste";
        qrySelect += " FROM (";
        qrySelect += " select a.datum, a.name, count(m.mitgliedid) as Teilnehmer, a.gaeste";
        qrySelect += " from anlaesse a";
        qrySelect += " LEFT JOIN meisterschaft m";
        qrySelect += " on (a.id = m.eventid)";
        qrySelect += " where year(a.datum) = " + objSave.year;
        qrySelect += " and a.nachkegeln = 0";
        qrySelect += " group by a.datum, a.name, a.gaeste";
        qrySelect += " order by a.datum) data";

        var dbChartData = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        )
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        Promise.resolve(dbChartData)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });


        worksheet = workbook.getWorksheet('Datenbereich für Beteiligung');
        row = 3

        for (const chData of dbChartData) {
            worksheet.insertRow(row, ['', chData.anlass, chData.teilnehmer, chData.gaeste]);
            row++;
        }

        // Auswertung mit Vorjahr erstellen
        qrySelect = "SELECT CONCAT(date_format(a.datum, '%d.%m.%Y'),' ',a.name) as anlass,";
        qrySelect += " (ma.anzahl + a.gaeste) as aktjahr,";
        qrySelect += " (mv.anzahl + av.gaeste) as vorjahr";
        qrySelect += " FROM anlaesse a";
        qrySelect += " LEFT JOIN (";
        qrySelect += " SELECT mc.eventid,";
        qrySelect += " count(mc.mitgliedid) as anzahl";
        qrySelect += " from meisterschaft mc";
        qrySelect += " group by mc.eventid";
        qrySelect += " ) ma on (a.id = ma.eventid)";
        qrySelect += " JOIN anlaesse av on (a.anlaesseid = av.id)";
        qrySelect += " LEFT JOIN (";
        qrySelect += " SELECT mcv.eventid,";
        qrySelect += " count(mcv.mitgliedid) as anzahl";
        qrySelect += " from meisterschaft mcv";
        qrySelect += " group by mcv.eventid";
        qrySelect += " ) mv on (av.id = mv.eventid)";
        qrySelect += " WHERE year(a.datum) = " + objSave.year;
        qrySelect += " and a.nachkegeln = 0";
        qrySelect += " ORDER BY a.datum";

        dbChartData = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        )
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });
        Promise.resolve(dbChartData)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        worksheet = workbook.getWorksheet('Datenbereich Vergleich Vorjahr');
        row = 3

        for (const chData of dbChartData) {
            worksheet.insertRow(row, ['', chData.anlass, chData.aktjahr, chData.vorjahr]);
            row++;
        }

        // Datei sichern
        var filename = "Meisterschaft-" + objSave.year + ".xlsx";
        await workbook.xlsx.writeFile("./public/exports/" + filename)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        return res.json({
            type: "info",
            message: "Excelfile erstellt",
            filename: filename
        });

    },

    /**
     * Erstellt Stammblätter mit oder ohne Daten
     * @param {Request} req 
     * @param {Response} res 
     */
    writeExcelTemplate: async function (req, res) {
        console.log("writeExcelTemplate");

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Janine Franken";

        // Force workbook calculation on load
        workbook.calcProperties.fullCalcOnLoad = true;

        let sheet
        let oneAdresse

        var objSave = req.body;

        switch (objSave.type) {
            case 0:
                // Datenblatt leer
                sheet = workbook.addWorksheet("Template", {
                    pageSetup: {
                        fitToPage: true,
                        fitToHeight: 1,
                        fitToWidth: 1,
                    },
                });
                await createTemplate(objSave.year, sheet, true);
                //sheet.commit();
                break;

            case 1:
                // Datenblatt leer für Adressen
                if (objSave.id == 0) {
                    // für alle aktiven Mitglieder
                    let dbAdressen = await db.Adressen.findAll({
                        where: {
                            austritt: {
                                [Op.gte]: new Date()
                            }
                        },
                        order: [["name", "asc"], ["vorname", "asc"]]
                    })
                    .catch((e) => {
                        console.error(e);
                        res.json({
                            type: "error",
                            message: e,
                        });
                    });            
                    Promise.resolve(dbAdressen)
                    .catch((e) => {
                        console.error(e);
                        res.json({
                            type: "error",
                            message: e,
                        });
                    });
            
                    for (const adress of dbAdressen) {
                        sheet = workbook.addWorksheet(adress.vorname + " " + adress.name, {
                            pageSetup: {
                                fitToPage: true,
                                fitToHeight: 1,
                                fitToWidth: 1,
                            },
                        });
                        await createTemplate(objSave.year, sheet, true);
                        await fillName(sheet, adress);
                        //sheet.commit();
                    }

                } else {
                    // für ein Mitglied
                    oneAdresse = await db.Adressen.findByPk(objSave.id)
                    .catch((e) => {
                        console.error(e);
                        res.json({
                            type: "error",
                            message: e,
                        });
                    });
                    Promise.resolve(oneAdresse)
                    .catch((e) => {
                        console.error(e);
                        res.json({
                            type: "error",
                            message: e,
                        });
                    });
                    sheet = workbook.addWorksheet(oneAdresse.vorname + " " + oneAdresse.name, {
                        pageSetup: {
                            fitToPage: true,
                            fitToHeight: 1,
                            fitToWidth: 1,
                        },
                    });
                    await createTemplate(objSave.year, sheet, true);
                    await fillName(sheet, oneAdresse);
                    //sheet.commit();
                }
                break;

            case 2:
                // Datenblatt gefüllt für Adressen
                if (objSave.id == 0) {
                    // für alle aktiven Mitglieder
                    var qrySelect = "SELECT * FROM adressen where austritt > now() and id in (";
                    qrySelect += "SELECT m.mitgliedid FROM meisterschaft m join anlaesse a on (m.eventid = a.id and year(a.datum) = " + objSave.year;
                    qrySelect += ")) order by name, vorname";

                    const dbAdressen = await sequelize.query(qrySelect, {
                        type: Sequelize.QueryTypes.SELECT,
                        model: Adressen,
                        mapToModel: true,
                        logging: console.log
                    });

                    for (const adress of dbAdressen) {
                        sheet = workbook.addWorksheet(adress.vorname + " " + adress.name, {
                            pageSetup: {
                                fitToPage: true,
                                fitToHeight: 1,
                                fitToWidth: 1,
                            },
                        });
                        await createTemplate(objSave.year, sheet, false);
                        await fillName(sheet, adress);
                        await fillTemplate(sheet, adress.id, objSave.year);
                        //sheet.commit();
                    }

                } else {
                    // für ein Mitglied
                    oneAdresse = await db.Adressen.findByPk(objSave.id)
                    .catch((e) => {
                        console.error(e);
                        res.json({
                            type: "error",
                            message: e,
                        });
                    });
            
                    Promise.resolve(oneAdresse)
                    .catch((e) => {
                        console.error(e);
                        res.json({
                            type: "error",
                            message: e,
                        });
                    });           

                    sheet = workbook.addWorksheet(oneAdresse.vorname + " " + oneAdresse.name, {
                        pageSetup: {
                            fitToPage: true,
                            fitToHeight: 1,
                            fitToWidth: 1,
                        },
                    });
                    await createTemplate(objSave.year, sheet, false);
                    await fillName(sheet, oneAdresse);
                    await fillTemplate(sheet, oneAdresse.id, objSave.year);
                    //sheet.commit;
                }
                break;

            default:
                break;
        }

        const filename = "Stammblätter-" + objSave.year + ".xlsx";
        await workbook.xlsx.writeFile("./public/exports/" + filename)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        return res.json({
            type: "info",
            message: "Excelfile erstellt",
            filename: filename
        });
    },

    /**
     * Write Bilanz and Erfolgsrechnung to Excelfile
     * @param {Request} req 
     * @param {Response} res 
     */

    writeExcelData: async function (req, res) {
        // TODO #38
        var sjahr = req.query.jahr;
        var iVJahr = eval((sjahr * 1) - 1);
        var iNJahr = eval((sjahr * 1) + 1);

        const workbook = new ExcelJS.Workbook();

        // Force workbook calculation on load
        workbook.calcProperties.fullCalcOnLoad = true;

        var bsheet = workbook.addWorksheet("Bilanz", {
            pageSetup: {
                fitToPage: true,
                fitToHeight: 1,
                fitToWidth: 1,
            },
            properties: {
                defaultRowHeight: 22
            },
            headerFooter: {
                oddHeader: "&18Auto-Moto-Club Swissair",
                oddFooter: "&14Bilanz " + sjahr
            }
        });

        var esheet = workbook.addWorksheet("Erfolgsrechnung", {
            pageSetup: {
                fitToPage: true,
                fitToHeight: 1,
                fitToWidth: 1,
            },
            properties: {
                defaultRowHeight: 22
            },
            headerFooter: {
                oddHeader: "&18Auto-Moto-Club Swissair",
                oddFooter: "&14Erfolgsrechnung " + sjahr
            }
        });

        var busheet = workbook.addWorksheet("Budget", {
            pageSetup: {
                fitToPage: true,
                fitToHeight: 1,
                fitToWidth: 1,
            },
            properties: {
                defaultRowHeight: 22
            },
            headerFooter: {
                oddHeader: "&18Auto-Moto-Club Swissair",
                oddFooter: "&14Budget " + iNJahr
            }
        });

        var qrySelect = "Select ac.`id`, ac.`level`, ac.`order`, ac.`name`, 0 as amount, 0 as amountVJ, ac.`status`, b1.amount as budget, b2.amount as budgetVJ, b3.amount as budgetNJ ";
        qrySelect += " from account ac ";
        qrySelect += " LEFT OUTER JOIN `budget` AS b1 ON ac.`id` = b1.`account` AND b1.`year` = " + sjahr;
        qrySelect += " LEFT OUTER JOIN `budget` AS b2 ON ac.`id` = b2.`account` AND b2.`year` = " + iVJahr;
        qrySelect += " LEFT OUTER JOIN `budget` AS b3 ON ac.`id` = b3.`account` AND b3.`year` = " + iNJahr;
        qrySelect += " order by ac.`level`, ac.`order`";
        var accData = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        )
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        qrySelect = "select j.from_account, sum(j.amount) as amount";
        qrySelect += " from journal j";
        qrySelect += " where year(j.date) = " + sjahr;
        qrySelect += " group by j.from_account";

        var arrAmount = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        )
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });
        for (let ind2 = 0; ind2 < arrAmount.length; ind2++) {
            const element = arrAmount[ind2];
            var found = accData.findIndex(acc => acc.id == element.from_account);
            accData[found].amount = eval(element.amount + 0);
        }


        qrySelect = "select j.to_account, sum(j.amount) as amount";
        qrySelect += " from journal j";
        qrySelect += " where year(j.date) = " + sjahr;
        qrySelect += " group by j.to_account";

        arrAmount = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        )
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });
        for (let ind2 = 0; ind2 < arrAmount.length; ind2++) {
            const element = arrAmount[ind2];
            found = accData.findIndex(acc => acc.id == element.to_account);
            switch (accData[found].level) {
                case 1:
                case 4:
                    accData[found].amount = eval(accData[found].amount - element.amount);
                    break;
                case 2:
                case 6:
                    accData[found].amount = eval(element.amount - accData[found].amount);
                    break;
            }
        }

        qrySelect = "select j.from_account, sum(j.amount) as amount";
        qrySelect += " from journal j";
        qrySelect += " where year(j.date) = " + iVJahr;
        qrySelect += " group by j.from_account";

        arrAmount = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });
        for (let ind2 = 0; ind2 < arrAmount.length; ind2++) {
            const element = arrAmount[ind2];
            found = accData.findIndex(acc => acc.id == element.from_account);
            accData[found].amountVJ = eval(element.amount + 0);
        }


        qrySelect = "select j.to_account, sum(j.amount) as amount";
        qrySelect += " from journal j";
        qrySelect += " where year(j.date) = " + iVJahr;
        qrySelect += " group by j.to_account";

        arrAmount = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });
        for (let ind2 = 0; ind2 < arrAmount.length; ind2++) {
            const element = arrAmount[ind2];
            found = accData.findIndex(acc => acc.id == element.to_account);
            switch (accData[found].level) {
                case 1:
                case 4:
                    accData[found].amountVJ = eval(accData[found].amountVJ - element.amount);
                    break;
                case 2:
                case 6:
                    accData[found].amountVJ = eval(element.amount - accData[found].amountVJ);
                    break;
            }
        }

        // Schreibe Bilanzdaten
        setCellValueFormat(bsheet, 'B1', "Bilanz " + sjahr, false, false, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
        setCellValueFormat(bsheet, 'B3', "Konto", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(bsheet, 'C3', "Bezeichnung", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(bsheet, 'D3', "Saldo " + sjahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        bsheet.getCell('D3').alignment = { horizontal: "right" };
        setCellValueFormat(bsheet, 'E3', "Saldo " + iVJahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        bsheet.getCell('E3').alignment = { horizontal: "right" };
        setCellValueFormat(bsheet, 'F3', "Differenz", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        bsheet.getCell('F3').alignment = { horizontal: "right" };

        var accBData = accData.filter(function (value, index, array) {

            return (value.status == 1 || value.amount != 0 || value.amountVJ != 0) && value.level < 3;
        });
        var Total = writeArray(bsheet, accBData, 4, false);
        var row = Total.lastRow + 2;
        var formula1 = { formula: 'D' + Total.total1 + '-D' + Total.total2 };
        var formula2 = { formula: 'E' + Total.total1 + '-E' + Total.total2 };
        var formula3 = { formula: 'D' + row + '-E' + row };
        setCellValueFormat(bsheet, 'B' + row, "Gewinn / Verlust", true, 'B' + row + ':C' + row, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
        setCellValueFormat(bsheet, 'D' + row, formula1, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(bsheet, 'E' + row, formula2, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(bsheet, 'F' + row, formula3, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        bsheet.getCell('D' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        bsheet.getCell('E' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        bsheet.getCell('F' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';

        bsheet.getColumn('C').width = 32;
        bsheet.getColumn('D').width = 18;
        bsheet.getColumn('E').width = 18;
        bsheet.getColumn('F').width = 18;

        // Schreibe Erfolgsrechnung
        setCellValueFormat(esheet, 'B1', "Erfolgsrechnung " + sjahr, false, false, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
        setCellValueFormat(esheet, 'B3', "Konto", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(esheet, 'C3', "Bezeichnung", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(esheet, 'D3', "Saldo " + sjahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        esheet.getCell('D3').alignment = { horizontal: "right" };
        setCellValueFormat(esheet, 'E3', "Saldo " + iVJahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        esheet.getCell('E3').alignment = { horizontal: "right" };
        setCellValueFormat(esheet, 'F3', "Differenz", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        esheet.getCell('F3').alignment = { horizontal: "right" };
        setCellValueFormat(esheet, 'G3', "Budget " + sjahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        esheet.getCell('G3').alignment = { horizontal: "right" };
        setCellValueFormat(esheet, 'H3', "Differenz", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        esheet.getCell('H3').alignment = { horizontal: "right" };

        var accEData = accData.filter(function (value, index, array) {
            return (value.status == 1 || value.amount != 0 || value.amountVJ != 0) && value.level > 2 && value.level < 9;
        });
        Total = writeArray(esheet, accEData, 4, true);
        row = Total.lastRow + 2;
        formula1 = { formula: 'D' + Total.total2 + '-D' + Total.total1 };
        formula2 = { formula: 'E' + Total.total2 + '-E' + Total.total1 };
        formula3 = { formula: 'D' + row + '-E' + row };
        var formula4 = { formula: 'G' + Total.total2 + '-G' + Total.total1 };
        var formula5 = { formula: 'G' + row + '-D' + row };
        setCellValueFormat(esheet, 'B' + row, "Gewinn / Verlust", true, 'B' + row + ':C' + row, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
        setCellValueFormat(esheet, 'D' + row, formula1, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(esheet, 'E' + row, formula2, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(esheet, 'F' + row, formula3, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(esheet, 'G' + row, formula4, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(esheet, 'H' + row, formula5, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        esheet.getCell('D' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        esheet.getCell('E' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        esheet.getCell('F' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        esheet.getCell('G' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        esheet.getCell('H' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';

        esheet.getColumn('C').width = 32;
        esheet.getColumn('D').width = 18;
        esheet.getColumn('E').width = 18;
        esheet.getColumn('F').width = 18;
        esheet.getColumn('G').width = 18;
        esheet.getColumn('H').width = 18;

        // Schreibe Budgetvergleich
        setCellValueFormat(busheet, 'B1', "Budget " + iNJahr, false, false, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
        setCellValueFormat(busheet, 'B3', "Konto", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(busheet, 'C3', "Bezeichnung", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(busheet, 'D3', "Saldo " + sjahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        busheet.getCell('D3').alignment = { horizontal: "right" };
        setCellValueFormat(busheet, 'E3', "Budget " + sjahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        busheet.getCell('E3').alignment = { horizontal: "right" };
        setCellValueFormat(busheet, 'F3', "Differenz", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        busheet.getCell('F3').alignment = { horizontal: "right" };
        setCellValueFormat(busheet, 'G3', "Budget " + iNJahr, true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        busheet.getCell('G3').alignment = { horizontal: "right" };
        setCellValueFormat(busheet, 'H3', "Differenz", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        busheet.getCell('H3').alignment = { horizontal: "right" };

        Total = writeArray(busheet, accEData, 4, true, true);

        row = Total.lastRow + 2;
        formula1 = { formula: 'D' + Total.total2 + '-D' + Total.total1 };
        formula2 = { formula: 'E' + Total.total2 + '-E' + Total.total1 };
        formula3 = { formula: 'E' + row + '-D' + row };
        formula4 = { formula: 'G' + Total.total2 + '-G' + Total.total1 };
        formula5 = { formula: 'G' + row + '-E' + row };
        setCellValueFormat(busheet, 'B' + row, "Gewinn / Verlust", true, 'B' + row + ':C' + row, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
        setCellValueFormat(busheet, 'D' + row, formula1, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(busheet, 'E' + row, formula2, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(busheet, 'F' + row, formula3, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(busheet, 'G' + row, formula4, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        setCellValueFormat(busheet, 'H' + row, formula5, true, '', { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
        busheet.getCell('D' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        busheet.getCell('E' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        busheet.getCell('F' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        busheet.getCell('G' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
        busheet.getCell('H' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';

        busheet.getColumn('C').width = 32;
        busheet.getColumn('D').width = 18;
        busheet.getColumn('E').width = 18;
        busheet.getColumn('F').width = 18;
        busheet.getColumn('G').width = 18;
        busheet.getColumn('H').width = 18;

        const filename = "Bilanz-" + sjahr + ".xlsx";
        await workbook.xlsx.writeFile("./public/exports/" + filename)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
        });

        return res.json({
            type: "info",
            message: "Excelfile erstellt",
            filename: filename
        });
    },

    /**
     * Schreibe die Kontoauszüge in eine Exceldatei.
     * Pro Konto ein Worksheet
     * 
     * @param {Request} req 
     * @param {Response} res 
    */
    writeAccountToExcel: async function (req, res) {
        const sJahr = req.query.jahr;
        const sAll = req.query.all

        // read all the data from the database
        var qrySelect = "SELECT * FROM account";
        qrySelect += " WHERE `order` > 9";
        if (sAll == 0) {
            qrySelect += " AND (id in (select from_account from journal where year(date) = " + req.query.jahr + ")";
            qrySelect += " OR id in (select to_account from journal where year(date) = " + req.query.jahr + "))";
        } else {
            qrySelect += " AND status = 1";
        }
        qrySelect += " ORDER BY level ASC , `order` ASC";
        var arData = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                model: db.Account,
                raw: false
            }
        ).catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
            return;
        });

        const workbook = new ExcelJS.Workbook();

        // Force workbook calculation on load
        workbook.calcProperties.fullCalcOnLoad = true;

        for (let index = 0; index < arData.length; index++) {
            const element = arData[index];

            var sSheetName = element.order + " " + element.name.replace("/", "");
            var sheet = workbook.addWorksheet(sSheetName.substr(0, 31), {
                pageSetup: {
                    fitToPage: true,
                    fitToHeight: 1,
                    fitToWidth: 1,
                },
                properties: {
                    defaultRowHeight: 18
                },
                headerFooter: {
                    oddHeader: "&18Auto-Moto-Club Swissair",
                    oddFooter: "&14" + element.element + " " + element.name + " " + sJahr
                }
            });

            setCellValueFormat(sheet, 'B1', element.order + " " + element.name, false, false, { bold: true, size: iFontSizeHeader, name: 'Tahoma' });
            setCellValueFormat(sheet, 'B3', "No.", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            setCellValueFormat(sheet, 'C3', "Datum", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            setCellValueFormat(sheet, 'D3', "Gegenkonto", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            setCellValueFormat(sheet, 'E3', "Text ", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            setCellValueFormat(sheet, 'F3', "Soll ", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            sheet.getCell('F3').alignment = { horizontal: "right" };
            setCellValueFormat(sheet, 'G3', "Haben", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            sheet.getCell('G3').alignment = { horizontal: "right" };
            setCellValueFormat(sheet, 'H3', "Saldo", true, false, { bold: true, size: iFontSizeTitel, name: 'Tahoma' });
            sheet.getCell('H3').alignment = { horizontal: "right" };
            sheet.getColumn('B').width = 12;
            sheet.getColumn('C').width = 12;
            sheet.getColumn('D').width = 35;
            sheet.getColumn('E').width = 55;
            sheet.getColumn('F').width = 12;
            sheet.getColumn('G').width = 12;
            sheet.getColumn('H').width = 12;


            var iSaldo = 0.0;
            var iRow = 4;
            qrySelect = "SELECT journalNo,date, date_format(date, '%d.%m.%Y') as formdate, from_account, to_account, memo, amount FROM journal";
            qrySelect += " WHERE year(date) = " + sJahr;
            qrySelect += " AND (from_account = " + element.id;
            qrySelect += " OR to_account = " + element.id;
            qrySelect += ") ORDER by journalNo, date";

            var arJournal = await sequelize.query(qrySelect,
                {
                    type: Sequelize.QueryTypes.SELECT,
                    plain: false,
                    logging: console.log,
                    raw: false
                }
            ).catch((e) => {
                console.error(e);
                res.json({
                    type: "error",
                    message: e,
                });
                return;
            });

            for (let ind2 = 0; ind2 < arJournal.length; ind2++) {
                const entry = arJournal[ind2];
                const iAmount = eval(entry.amount + 0);

                setCellValueFormat(sheet, 'B' + iRow, entry.journalNo, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                setCellValueFormat(sheet, 'C' + iRow, entry.formdate, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                setCellValueFormat(sheet, 'E' + iRow, entry.memo, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                sheet.getCell('F' + iRow).numFmt = '#,##0.00;[Red]\-#,##0.00';
                sheet.getCell('G' + iRow).numFmt = '#,##0.00;[Red]\-#,##0.00';
                sheet.getCell('H' + iRow).numFmt = '#,##0.00;[Red]\-#,##0.00';

                if (entry.from_account == element.id) {
                    const toAcc = arData.find(rec => rec.id == entry.to_account);
                    if (toAcc)
                        setCellValueFormat(sheet, 'D' + iRow, toAcc.order + " " + toAcc.name, true, false, { size: iFontSizeTitel, name: 'Tahoma' });
                    else
                        setCellValueFormat(sheet, 'D' + iRow, entry.to_account, true, false, { size: iFontSizeTitel, name: 'Tahoma' });

                    setCellValueFormat(sheet, 'F' + iRow, iAmount, true, false, { size: iFontSizeTitel, name: 'Tahoma' });
                    setCellValueFormat(sheet, 'G' + iRow, "", true, false, { size: iFontSizeTitel, name: 'Tahoma' });
                    if (element.level == 2 || element.level == 6)
                        iSaldo -= iAmount;
                    else
                        iSaldo += iAmount;
                    setCellValueFormat(sheet, 'H' + iRow, iSaldo, true, false, { size: iFontSizeTitel, name: 'Tahoma' });
                } else {
                    const fromAcc = arData.find(rec => rec.id == entry.from_account);
                    if (fromAcc)
                        setCellValueFormat(sheet, 'D' + iRow, fromAcc.order + " " + fromAcc.name, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                    else
                        setCellValueFormat(sheet, 'D' + iRow, entry.from_account, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                    setCellValueFormat(sheet, 'F' + iRow, "", true, false, { size: iFontSizeRow, name: 'Tahoma' });
                    setCellValueFormat(sheet, 'G' + iRow, iAmount, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                    if (element.level == 2 || element.level == 6)
                        iSaldo += iAmount;
                    else
                        iSaldo -= iAmount;
                    setCellValueFormat(sheet, 'H' + iRow, iSaldo, true, false, { size: iFontSizeRow, name: 'Tahoma' });
                }
                iRow++;
            }

            sheet.commit = true;
        }

        const filename = "Kontoauszug-" + sJahr + ".xlsx";
        await workbook.xlsx.writeFile("./public/exports/" + filename)
        .catch((e) => {
            console.error(e);
            res.json({
                type: "error",
                message: e,
            });
            return;
        });

        return res.json({
            type: "info",
            message: "Excelfile erstellt",
            filename: filename
        });

    },
};

/**
 * 
 * @param {ExcelJS.Worksheet} sheet 
 * @param {Array} arData 
 * @param {number} firstRow 
 * @param {boolean} fBudget
 * @param {boolean} fBudgetVergleich
 */
function writeArray(sheet, arData, firstRow, fBudget = false, fBudgetVergleich = false) {
    var row = firstRow;

    var cellLevel;

    for (let ind2 = 0; ind2 < arData.length; ind2++) {
        const element = arData[ind2];
        if (element.level == element.order) {
            row++;
            cellLevel = row;
            setCellValueFormat(sheet, "B" + row, element.name, true, "B" + row + ":C" + row, { name: 'Tahoma', bold: true, size: iFontSizeTitel})

            setCellValueFormat(sheet, "D" + row, '', true, '', { name: 'Tahoma', bold: true, size: iFontSizeTitel})
            setCellValueFormat(sheet, "E" + row, '', true, '', { name: 'Tahoma', bold: true, size: iFontSizeTitel})
            setCellValueFormat(sheet, "F" + row, '', true, '', { name: 'Tahoma', bold: true, size: iFontSizeTitel})

            sheet.getCell('D' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            sheet.getCell('E' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            sheet.getCell('F' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            if (fBudget) {
                setCellValueFormat(sheet, "G" + row, '', true, '', { name: 'Tahoma', bold: true, size: iFontSizeTitel})
                setCellValueFormat(sheet, "H" + row, '', true, '', { name: 'Tahoma', bold: true, size: iFontSizeTitel})
    
                sheet.getCell('G' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
                sheet.getCell('H' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            }
        } else {
            var font = { name: 'Tahoma', size: iFontSizeRow};
            setCellValueFormat(sheet, "B" + row, element.order, true, '', font);
            setCellValueFormat(sheet, "C" + row, element.name, true, '', font);
            setCellValueFormat(sheet, 'D' + row, element.amount, true, '', font);
            setCellValueFormat(sheet, 'E' + row, element.amountVJ, true, '', font);

            setCellValueFormat(sheet, 'F' + row, { formula: 'D' + row + '-E' + row }, true, '', font);

            sheet.getCell('D' + cellLevel).value = { formula: '=SUM(D' + eval(cellLevel + 1) + ':' + 'D' + row + ')' };
            sheet.getCell('E' + cellLevel).value = { formula: '=SUM(E' + eval(cellLevel + 1) + ':' + 'E' + row + ')' };
            sheet.getCell('F' + cellLevel).value = { formula: '=SUM(F' + eval(cellLevel + 1) + ':' + 'F' + row + ')' };

            sheet.getCell('D' + row).alignment = {
                horizontal: "right",
            };
            sheet.getCell('E' + row).alignment = {
                horizontal: "right",
            };
            sheet.getCell('F' + row).alignment = {
                horizontal: "right",
            };

            sheet.getCell('D' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            sheet.getCell('E' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            sheet.getCell('F' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';

            if (fBudget) {
                setCellValueFormat(sheet, 'G' + row, eval(element.budget * 1), true, '', font);

                setCellValueFormat(sheet, 'H' + row, { formula: 'G' + row + '-D' + row }, true, '', font);

                sheet.getCell('G' + cellLevel).value = { formula: '=SUM(G' + eval(cellLevel + 1) + ':' + 'G' + row + ')' };
                sheet.getCell('H' + cellLevel).value = { formula: '=SUM(H' + eval(cellLevel + 1) + ':' + 'H' + row + ')' };

                sheet.getCell('G' + row).alignment = {
                    horizontal: "right",
                };
                sheet.getCell('H' + row).alignment = {
                    horizontal: "right",
                };
    
                sheet.getCell('G' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
                sheet.getCell('H' + row).numFmt = '#,##0.00;[Red]\-#,##0.00';
            }

            if (fBudgetVergleich) {
                setCellValueFormat(sheet, 'E' + row, eval(element.budget * 1), true, '', font);
                setCellValueFormat(sheet, 'F' + row, { formula: 'E' + row + '-D' + row }, true, '', font);
                setCellValueFormat(sheet, 'G' + row, eval(element.budgetNJ * 1), true, '', font);
                setCellValueFormat(sheet, 'H' + row, { formula: 'G' + row + '-E' + row }, true, '', font);
            }
        }

        row++;
    }

    return { lastRow: row - 1, total1: firstRow + 1, total2: cellLevel };
}

/**
 * 
 * @param {ExcelJS.Worksheet} sheet 
 * @param {number} id 
 * @param {string} syear 
 */
async function fillTemplate(sheet, id, syear) {
    var qrySelect = "SELECT * FROM meisterschaft where eventid in (";
    qrySelect += "SELECT id FROM anlaesse where year(datum) = " + syear;
    qrySelect += ") and mitgliedid = " + id + " order by id";

    const data = await sequelize.query(qrySelect, {
        type: Sequelize.QueryTypes.SELECT,
        model: Meisterschaft,
        mapToModel: true,
        logging: console.log
    });

    if (data.length > 0) {
        var cols = sheet.getColumn('K');

        var clubTotal = 0
        var kegelTotal = 0

        cols.eachCell(function (cell, row) {
            if (cell.value != null && cell.value != "eventId") {
                for (let meisterschaft of data) {

                    if (cell.value == meisterschaft.eventId) {
                        sheet.getCell('A' + cell.row).value = meisterschaft.punkte;
                        clubTotal += meisterschaft.punkte;

                        if (meisterschaft.wurf1 > 0 || meisterschaft.wurf2 > 0 || meisterschaft.wurf3 > 0 || meisterschaft.wurf4 > 0 || meisterschaft.wurf5 > 0) {
                            // Kegelresultat
                            var kegelSumme = meisterschaft.wurf1 + meisterschaft.wurf2 + meisterschaft.wurf3 + meisterschaft.wurf4 + meisterschaft.wurf5 + meisterschaft.zusatz;
                            sheet.getCell('C' + cell.row).value = meisterschaft.wurf1;
                            sheet.getCell('D' + cell.row).value = meisterschaft.wurf2;
                            sheet.getCell('E' + cell.row).value = meisterschaft.wurf3;
                            sheet.getCell('F' + cell.row).value = meisterschaft.wurf4;
                            sheet.getCell('G' + cell.row).value = meisterschaft.wurf5;
                            sheet.getCell('I' + cell.row).value = kegelSumme;
                            if (meisterschaft.streichresultat == 0) {
                                kegelTotal += kegelSumme;
                            } else {
                                // setzte diagonale Linie - > Streichresultat                                
                                sheet.getRow(row).eachCell({ includeEmpty: false }, function (formatCell, colNumber) {
                                    formatCell.border = {
                                        diagonal: {
                                            up: true,
                                            down: true,
                                            style: 'thin',
                                            color: {
                                                argb: '999999'
                                            }
                                        }
                                    };
                                });
                            }
                        }
                        break;
                    }
                }
            }
        });

        // Jetzt noch die Totals schreiben
        for (let i = sFirstRow; i <= sheet.lastRow.number; i++) {
            const row = sheet.getRow(i);
            if (row.getCell('F').value == "Total Kegeln") {
                row.getCell('I').value = kegelTotal;
            } else if (row.getCell('B').value == "Total Club") {
                row.getCell('A').value = clubTotal;
            }
        }


    }

}

/**
 * 
 * @param {ExcelJS.Worksheet} sheet 
 * @param {db.Adressen} adress 
 */
async function fillName(sheet, adress) {

    let cell = sheet.getCell(cName)
    cell.value = adress.name;
    cell = sheet.getCell(cVorname)
    cell.value = adress.vorname;
}

/**
 * 
 * @param {string} syear 
 * @param {ExcelJS.Worksheet} sheet 
 * @param {number} inclPoints 
 */
async function createTemplate(syear, sheet, inclPoints) {
    // read all events
    let dbEvents = await db.Anlaesse.findAll({
        where: sequelize.where(sequelize.fn('YEAR', sequelize.col('datum')), syear),
        order: [
            ["istkegeln", "desc"],
            ["datum", "asc"],
            ["name", "asc"],
        ],
    })
    .catch((e) => {
        console.error(e);
        res.json({
            type: "error",
            message: e,
        });
    });

    setCellValueFormat(sheet, "A2", "CLUB/KEGELMEISTERSCHAFT", false, "A2:I2", { bold: true, size: iFontSizeHeader });
    let cell = sheet.getCell("A2");
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };

    setCellValueFormat(sheet, "A4", syear, false, "A4:I4");

    cell = sheet.getCell("A4");
    cell.font = {
        bold: true,
        size: iFontSizeHeader,
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };

    sheet.getCell("B6").value = "Name:";
    sheet.getCell("B6").font = {
        bold: true,
        size: iFontSizeTitel
    };
    sheet.getCell(cName).font = {
        bold: true,
        size: iFontSizeTitel
    };
    sheet.getCell("B7").value = "Vorname:";
    sheet.getCell("B7").font = {
        bold: true,
        size: iFontSizeTitel
    };
    sheet.getCell(cVorname).font = {
        size: iFontSizeTitel
    };

    setCellValueFormat(sheet, "C11", "Kegelmeisterschaft", true, "C11:E11", {bold: true, size: iFontSizeTitel});

    let row = sFirstRow - 1;
    setCellValueFormat(sheet, "A" + row, "Club", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "B" + row, "Datum", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "C" + row, "Resultate", true, "C" + row + ":G" + row, {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "H" + row, "z Pkt.", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "I" + row, "Total", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "J" + row, "Visum", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "K" + row, "eventId", false, "", {bold: true, size: iFontSizeRow});

    let clubTotal = 0;

    for (const event of dbEvents) {

        if (event.istkegeln == 1) {
            // clubevent einfache Liste
            row++;
            if (event.status == 1) {
                clubTotal += event.punkte;
                setCellValueFormat(sheet, "A" + row, (inclPoints ? event.punkte : ""), true, "", {size: iFontSizeRow});
            } else {
                setCellValueFormat(sheet, "A" + row, "", true, "", {size: iFontSizeRow, strike: true});
            }

            setCellValueFormat(sheet, "B" + row, event.datum, true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "C" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "D" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "E" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "F" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "G" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "H" + row, (event.nachkegeln == 0 ? 5 : 0), true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "I" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "J" + row, "", true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "K" + row, event.id, false, "", {size: iFontSizeRow});
        }
    }

    row++;
    setCellValueFormat(sheet, "F" + row, "Total Kegeln", true, "F" + row + ":H" + row, {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "I" + row, 0, true, "", {bold: true, size: iFontSizeRow});
    row++;
    row++;

    setCellValueFormat(sheet, "C" + row, "Clubmeisterschaft", true, "C" + row + ":E" + row, {bold: true, size: iFontSizeTitel});

    row++;
    setCellValueFormat(sheet, "A" + row, "Club", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "B" + row, "Datum", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "C" + row, "Bezeichnung", true, "C" + row + ":I" + row, {bold: true, size: iFontSizeRow});

    for (const event of dbEvents) {

        if (event.istkegeln != 1) {
            row++;
            // clubevent einfache Liste
            if (event.status > 0) {
                clubTotal += event.punkte;
                setCellValueFormat(sheet, "A" + row, (inclPoints ? event.punkte : ""), true, "", {size: iFontSizeRow});
            } else {
                setCellValueFormat(sheet, "A" + row, "", true, "", {size: iFontSizeRow, strike: true});
            }
            setCellValueFormat(sheet, "B" + row, event.datum, true, "", {size: iFontSizeRow});
            setCellValueFormat(sheet, "C" + row, event.name, true, "C" + row + ":I" + row, {size: iFontSizeRow});
            setCellValueFormat(sheet, "K" + row, event.id, false, "", {size: iFontSizeRow});
        }
    }

    row++;
    setCellValueFormat(sheet, "B" + row, "Total Club", true, "", {bold: true, size: iFontSizeRow});
    setCellValueFormat(sheet, "A" + row, (inclPoints ? clubTotal : 0), true, "", {bold: true, size: iFontSizeRow});


    sheet.getColumn("K").hidden = true;
    sheet.getColumn("J").width = 17;
    // Iterate over all rows (including empty rows) in a worksheet
    sheet.eachRow({
        includeEmpty: true
    }, function (rowData, rowNumber) {
        rowData.height = 15;
    });

}

/**
 * 
 * @param {ExcelJS.Worksheet} sheet Excel Worksheet
 * @param {string} cell Range
 * @param {*} value value to fill in cell
 * @param {Boolean} border Set thin boarder line
 * @param {Boolean} merge Merge the cells
 * @param {*} font Object of font settings
 */
function setCellValueFormat(sheet, range, value, border, merge, font) {
    var cell = sheet.getCell(range)
    cell.value = value;
    if (merge != "") {
        sheet.mergeCells(merge);
    }

    if (border)
        cell.border = {
            top: {
                style: "thin",
            },
            left: {
                style: "thin",
            },
            bottom: {
                style: "thin",
            },
            right: {
                style: "thin",
            }
        };

    if (font)
        cell.font = font;

}