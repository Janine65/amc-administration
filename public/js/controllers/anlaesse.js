var db = require("../db");
const {
  Op,
  Sequelize
} = require("sequelize");
const ExcelJS = require("exceljs");
const adresse = require("./adresse");
const { Meisterschaft, Adressen } = require("../db");
const cName = "C6";
const cVorname = "C7";
const sFirstRow = 13;

module.exports = {
  getData: function (req, res) {
    /*
      db.Anlaesse.findAll({
        where: {datum: { [Op.gte]: new Date('01.01.'+(global.Parameter.get('CLUBJAHR') - 1 )) }},
        //attributes: { inlcude: ['longname']},
        include: [
 //				{ model: db.Anlaesse, as: 'linkedEvent', required: false, attributes: ['longname']}
          { model: db.Anlaesse, as: 'linkedEvent', required: false, attributes: { inlcude: ['longname']}}
         ],
         order: [
           ['datum', 'asc']
         ]
     }).then(data => res.json(data));		
     */
    /*
         SELECT `anlaesse`.`id`, `anlaesse`.`datum`, `anlaesse`.`name`, `anlaesse`.`beschreibung`, `anlaesse`.`punkte`, `anlaesse`.`istkegeln`, `anlaesse`.`nachkegeln`, `anlaesse`.`gaeste`, `anlaesse`.`anlaesseId`, `anlaesse`.`status`, `anlaesse`.`createdAt`, `anlaesse`.`updatedAt`, 
         `linkedEvent`.`id` AS `linkedEvent.id`, `linkedEvent`.`longname` AS `linkedEvent.longname`
          FROM `anlaesse` AS `anlaesse` LEFT OUTER JOIN `anlaesse` AS `linkedEvent` ON `anlaesse`.`anlaesseId` = `linkedEvent`.`id` 
          WHERE `anlaesse`.`datum` >= '2019-01-01' ORDER BY `anlaesse`.`datum` ASC;
     */
    var qrySelect =
      "SELECT `anlaesse`.`id`, `anlaesse`.`datum`, `anlaesse`.`name`, `anlaesse`.`beschreibung`, `anlaesse`.`punkte`, `anlaesse`.`istkegeln`, `anlaesse`.`nachkegeln`, `anlaesse`.`istsamanlass`, `anlaesse`.`gaeste`, `anlaesse`.`anlaesseId`, `anlaesse`.`status`, `anlaesse`.`createdAt`, `anlaesse`.`updatedAt`, `linkedEvent`.`longname` as 'vorjahr'";
    qrySelect +=
      " FROM `anlaesse` AS `anlaesse` LEFT OUTER JOIN `anlaesse` AS `linkedEvent` ON `anlaesse`.`anlaesseId` = `linkedEvent`.`id`";
    qrySelect += " WHERE YEAR(`anlaesse`.`datum`) >= ";
    qrySelect += global.Parameter.get("CLUBJAHR") - 1;
    qrySelect += " ORDER BY `anlaesse`.`datum` ASC;";

    sequelize
      .query(qrySelect, {
        type: Sequelize.QueryTypes.SELECT,
        plain: false,
        logging: console.log,
        raw: false,
      })
      .then((data) => res.json(data));
  },

  getOverviewData: function (req, res) {
    // get a json file with the following information to display on first page:
    // count of anlaesse im system_param jahr
    // count of SAM_Mitglieder
    // count of not SAM_Mitglieder

    var qrySelect =
      "SELECT 'Total Anlässe' as label, count(id) as value from anlaesse where status = 1 and YEAR(`datum`) = ";
    qrySelect +=
      global.Parameter.get("CLUBJAHR") +
      " AND istsamanlass = 0 AND nachkegeln = 0";
    qrySelect +=
      " UNION SELECT 'Zukünftige Anlässe', count(id) from anlaesse where status = 1 and datum > NOW() and YEAR(`datum`) = ";
    qrySelect +=
      global.Parameter.get("CLUBJAHR") +
      " AND istsamanlass = 0 AND nachkegeln = 0";

    sequelize
      .query(qrySelect, {
        type: Sequelize.QueryTypes.SELECT,
        plain: false,
        logging: console.log,
        raw: false,
      })
      .then((data) => res.json(data));
  },

  getOneData: function (req, res) {
    db.Anlaesse.findByPk(req.param.id).then((data) => res.json(data));
  },

  getFKData: function (req, res) {
    var qrySelect =
      "SELECT `id`, `longname` as value FROM `anlaesse` WHERE status = 1 ";
    if (req.query.filter != null) {
      var qfield = "%" + req.query.filter.value + "%";
      qrySelect = qrySelect + " AND lower(`longname`) like '" + qfield + "'";
    }
    qrySelect = qrySelect + " ORDER BY datum desc";

    sequelize
      .query(qrySelect, {
        type: Sequelize.QueryTypes.SELECT,
        plain: false,
        logging: console.log,
        raw: false,
      })
      .then((data) => res.json(data));
  },

  removeData: function (req, res) {
    const data = req.body;
    if (data == undefined) {
      throw "Record not correct";
    }
    console.info("delete: ", data);
    db.Anlaesse.findByPk(data.id)
      .then((anlass) =>
        anlass
        .destroy()
        .then((obj) =>
          res.json({
            id: obj.id,
          })
        )
        .catch((e) => console.error(e))
      )
      .catch((e) => console.log(e));
  },

  addData: function (req, res) {
    var data = req.body;
    console.info("insert: ", data);
    db.Anlaesse.create(data)
      .then((obj) =>
        res.json({
          id: obj.id,
        })
      )
      .catch((e) => console.error(e));
  },

  updateData: function (req, res) {
    var data = req.body;
    if (data.id == 0 || data.id == null) {
      // insert
      console.info("insert: anlass", data);
      db.Anlaesse.create(data)
        .then((obj) =>
          res.json({
            id: obj.id,
          })
        )
        .catch((e) => console.error(e));
    } else {
      // update
      console.info("update: ", data);

      db.Anlaesse.findByPk(data.id)
        .then((anlass) =>
          anlass
          .update(data)
          .then((obj) =>
            res.json({
              id: obj.id,
            })
          )
          .catch((e) => console.error(e))
        )
        .catch((e) => console.error(e));
    }
  },

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
              order: [["name", "asc"],["vorname", "asc"]]
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

    const filename = "./public/Stammblätter.xlsx";
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