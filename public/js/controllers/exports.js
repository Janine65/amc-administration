var db = require("../db");
const {
    Sequelize
} = require("sequelize");

const ExcelJS = require("exceljs");
const cName = "C6";
const cVorname = "C7";
const sFirstRow = 13;


module.exports = {
    /**
   * Erstellt eine Exceldatei mit den Meisterschaftsauswertungen
   * @param {*} req 
   * @param {*} res 
   */
    writeAuswertung: async function (req, res) {
        console.log("writeExcelTemplate");

        var objSave = req.body;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile("./public/exports/Meisterschaft-Vorlage.xlsx");

        // Clubmeisterschaft lesen und exportieren
        var dbMeister = await Clubmeister.findAll({
            where: { jahr: { [Op.eq]: objSave.year } },
            order: [
                ['rang', 'asc']
            ]
        }).catch((e) => console.error(e));
        Promise.resolve(dbMeister)
            .catch((e) => console.error(e));

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
        }).catch((e) => console.error(e));
        Promise.resolve(dbMeister)
            .catch((e) => console.error(e));

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
            .catch(error => console.error(error));
        Promise.resolve(dbChartData)
            .catch((e) => console.error(e));

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
            .catch((e) => console.error(e));
        Promise.resolve(dbChartData)
            .catch((e) => console.error(e));

        worksheet = workbook.getWorksheet('Datenbereich Vergleich Vorjahr');
        row = 3

        for (const chData of dbChartData) {
            worksheet.insertRow(row, ['', chData.anlass, chData.aktjahr, chData.vorjahr]);
            row++;
        }

        // Datei sichern
        var filename = "./public/exports/Meisterschaft-" + objSave.year + ".xlsx";
        await workbook.xlsx.writeFile(filename).catch((e) => {
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
     * @param {*} req 
     * @param {*} res 
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
                        .catch((e) => console.error(e));
                    Promise.resolve(dbAdressen)
                        .catch((e) => console.error(e));

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
                        .catch((e) => console.error(e));
                    Promise.resolve(oneAdresse)
                        .catch((e) => console.error(e));
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
                        .catch((e) => console.error(e));
                    Promise.resolve(oneAdresse)
                        .catch((e) => console.error(e));

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

        const filename = "./public/exports/Stammblätter.xlsx";
        await workbook.xlsx.writeFile(filename).catch((e) => {
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


    writeExcelData: async function (req, res) {
        var sjahr = req.query.year;

        const workbook = new ExcelJS.Workbook();

        // Force workbook calculation on load
        workbook.calcProperties.fullCalcOnLoad = true;

        var bsheet = workbook.addWorksheet("Bilanz", {
            pageSetup: {
                fitToPage: true,
                fitToHeight: 1,
                fitToWidth: 1,
            },
        });

        var esheet = workbook.addWorksheet("Erfolgsrechnung", {
            pageSetup: {
                fitToPage: true,
                fitToHeight: 1,
                fitToWidth: 1,
            },
        });

        var qrySelect = "Select ac.`id`, ac.`level`, ac.`order`, ac.`name`, sum(j.`amount`) as amount ";
        qrySelect += " from account ac ";
        qrySelect += " left outer join journal j ";
        qrySelect += " on ac.id = j.from_account ";
        qrySelect += " and year(j.date) = " + sjahr;
        qrySelect += " group by ac.`id`,  ac.`level`, ac.`order`, ac.`name` ";
        qrySelect += " order by ac.`level`, ac.`order`";

        var accData = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => console.error(e));

        bsheet.getCell("B1").value = "AMC-Buchhaltung für das Jahr " + sjahr;
        let cell = bsheet.getCell("B1");
        cell.font = {
            bold: true,
            size: 14,
        };
        bsheet.getCell("B3").value = "Bilanz";
        cell = bsheet.getCell("B3");
        cell.font = {
            bold: true,
            size: 12,
        };
        var row = 4;
        var accBData = accData.filter(function (value, index, array) {
            return value.level < 3;
        });
        accBData.forEach(element => {
            if (element.level == element.order) {
                bsheet.getCell("B" + row).value = element.name;
                cell = bsheet.getCell("B3");
                cell.font = {
                    bold: true,
                    size: 12,
                };
            } else {
                bsheet.getCell("B" + row).value = element.order;
                bsheet.getCell("C" + row).value = element.name;
                bsheet.getCell("D" + row).value = element.amount;
                cell = bsheet.getCell("D" + row);
                cell.alignment = {
                    horizontal: "right",
                };
            }
            row++;
        });

        esheet.getCell("B1").value = "AMC-Buchhaltung für das Jahr " + sjahr;
        cell = esheet.getCell("B1");
        cell.font = {
            bold: true,
            size: 14,
        };
        esheet.getCell("B3").value = "Erfolgsrechnung";
        cell = esheet.getCell("B3");
        cell.font = {
            bold: true,
            size: 12,
        };
        row = 4;
        var accEData = accData.filter(function (value, index, array) {
            return value.level > 2 && value.level < 9;
        });
        accEData.forEach(element => {
            if (element.level == element.order) {
                esheet.getCell("B" + row).value = element.name;
                cell = esheet.getCell("B3");
                cell.font = {
                    bold: true,
                    size: 12,
                };
            } else {
                esheet.getCell("B" + row).value = element.order;
                esheet.getCell("C" + row).value = element.name;
                esheet.getCell("D" + row).value = element.amount;
                cell = esheet.getCell("D" + row);
                cell.alignment = {
                    horizontal: "right",
                };
            }
            row++;
        });

        const filename = "./public/exports/Bilanz.xlsx";
        await workbook.xlsx.writeFile(filename).catch((e) => {
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
};


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
                                sheet.getRow(row).border = {
                                    diagonal: {
                                        up: true,
                                        down: true,
                                        style: 'thick',
                                        color: {
                                            argb: 'FFFF0000'
                                        }
                                    }
                                };
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

async function fillName(sheet, adress) {

    let cell = sheet.getCell(cName)
    cell.value = adress.name;
    cell = sheet.getCell(cVorname)
    cell.value = adress.vorname;
}

async function createTemplate(syear, sheet, inclPoints) {
    // read all events
    let dbEvents = await db.Anlaesse.findAll({
        where: sequelize.where(sequelize.fn('YEAR', sequelize.col('datum')), syear),
        order: [
            ["istkegeln", "desc"],
            ["datum", "asc"],
            ["name", "asc"],
        ],
    }).catch((e) => {
        console.error(e);
    });

    setCellValueFormat(sheet, "A2", "CLUB/KEGELMEISTERSCHAFT", false, "A2:I2");
    let cell = sheet.getCell("A2");
    cell.font = {
        bold: true,
        size: 12,
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };

    setCellValueFormat(sheet, "A4", syear, false, "A4:I4");

    cell = sheet.getCell("A4");
    cell.font = {
        bold: true,
        size: 12,
    };
    cell.alignment = {
        vertical: "middle",
        horizontal: "center",
    };

    sheet.getCell("B6").value = "Name:";
    sheet.getCell("B6").font = {
        bold: true,
    };
    sheet.getCell(cName).font = {
        bold: true,
    };
    sheet.getCell("B7").value = "Vorname:";

    setCellValueFormat(sheet, "C11", "Kegelmeisterschaft", true, "C11:E11");
    sheet.getCell("C11").font = {
        bold: true,
    };

    let row = sFirstRow - 1;
    setCellValueFormat(sheet, "A" + row, "Club", true, "");
    setCellValueFormat(sheet, "B" + row, "Datum", true, "");
    setCellValueFormat(sheet, "C" + row, "Resultate", true, "C" + row + ":G" + row);
    setCellValueFormat(sheet, "H" + row, "z Pkt.", true, "");
    setCellValueFormat(sheet, "I" + row, "Total", true, "");
    setCellValueFormat(sheet, "J" + row, "Visum", true, "");
    setCellValueFormat(sheet, "K" + row, "eventId", false, "");

    let clubTotal = 0;

    for (const event of dbEvents) {

        if (event.istkegeln == 1) {
            // clubevent einfache Liste
            row++;
            if (event.status == 1) {
                clubTotal += event.punkte;
                setCellValueFormat(sheet, "A" + row, (inclPoints ? event.punkte : ""), true, "");
            } else {
                sheet.getCell("B" + row).font = {
                    strike: true
                };
                setCellValueFormat(sheet, "A" + row, "", true, "");
            }

            setCellValueFormat(sheet, "B" + row, event.datum, true, "");
            setCellValueFormat(sheet, "C" + row, "", true, "");
            setCellValueFormat(sheet, "D" + row, "", true, "");
            setCellValueFormat(sheet, "E" + row, "", true, "");
            setCellValueFormat(sheet, "F" + row, "", true, "");
            setCellValueFormat(sheet, "G" + row, "", true, "");
            setCellValueFormat(sheet, "H" + row, (event.nachkegeln == 0 ? 5 : 0), true, "");
            setCellValueFormat(sheet, "I" + row, "", true, "");
            setCellValueFormat(sheet, "J" + row, "", true, "");
            setCellValueFormat(sheet, "K" + row, event.id, false, "");
        }
    }

    row++;
    setCellValueFormat(sheet, "F" + row, "Total Kegeln", true, "F" + row + ":H" + row);
    setCellValueFormat(sheet, "I" + row, 0, true, "");
    row++;
    row++;

    setCellValueFormat(sheet, "C" + row, "Clubmeisterschaft", true, "C" + row + ":E" + row);
    sheet.getCell("C" + row).font = {
        bold: true,
    };

    row++;
    setCellValueFormat(sheet, "A" + row, "Club", true, "");
    setCellValueFormat(sheet, "B" + row, "Datum", true, "");
    setCellValueFormat(sheet, "C" + row, "Bezeichnung", true, "C" + row + ":I" + row);

    for (const event of dbEvents) {

        if (event.istkegeln != 1) {
            row++;
            // clubevent einfache Liste
            if (event.status > 0) {
                clubTotal += event.punkte;
                setCellValueFormat(sheet, "A" + row, (inclPoints ? event.punkte : ""), true, "");
            } else {
                setCellValueFormat(sheet, "A" + row, "", true, "");
                sheet.getCell("B" + row).font = {
                    strike: true
                };
            }
            setCellValueFormat(sheet, "B" + row, event.datum, true, "");
            setCellValueFormat(sheet, "C" + row, event.name, true, "C" + row + ":I" + row);
            setCellValueFormat(sheet, "K" + row, event.id, false, "");
        }
    }

    row++;
    setCellValueFormat(sheet, "B" + row, "Total Club", true, "");
    setCellValueFormat(sheet, "A" + row, (inclPoints ? clubTotal : 0), true, "");


    sheet.getColumn("K").hidden = true;
    sheet.getColumn("J").width = 17;
    // Iterate over all rows (including empty rows) in a worksheet
    sheet.eachRow({
        includeEmpty: true
    }, function (rowData, rowNumber) {
        rowData.height = 15;
    });

}

function setCellValueFormat(sheet, cell, value, border, merge) {
    sheet.getCell(cell).value = value;
    if (merge != "") {
        sheet.mergeCells(merge);
    }

    if (border)
        sheet.getCell(cell).border = {
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

}