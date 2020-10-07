var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");

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

    const sheet = workbook.addWorksheet("Template", {
      pageSetup: {
        fitToPage: true,
        fitToHeight: 1,
        fitToWidth: 1,
      },
    });

    await createTemplate(res, req.body.year, sheet).catch((e) => {
      console.error(e);
      res.json({
        type: "error",
        message: e,
      });
    });

    const filename = "./amcTemplate.xlsx";
    await workbook.xlsx.writeFile(filename).catch((e) => {
      console.error(e);
      res.json({
        type: "error",
        message: e,
      });
    });

    //res.json({type: "info", message: "Excelfile erstellt"})
  },
};

async function createTemplate(res, syear, sheet) {
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
    res.json({
      type: "error",
      message: e,
    });
  });

  sheet.mergeCells("A2:I2");
  let cell = sheet.getCell("A2");
  cell.value = "CLUB/KEGELMEISTERSCHAFT";
  cell.font = {
    bold: true,
    size: 12,
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  cell = sheet.getCell("A4");
  cell.value = syear;
  cell.font = {
    bold: true,
    size: 12,
  };
  sheet.mergeCells("A4:I4");
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  sheet.getCell("B6").value = "Name:";
  sheet.getCell("C6").name = "Nachname";
  sheet.getCell("B6:C6").font = {
    bold: true,
  };
  sheet.getCell("B7").value = "Vorname:";
  sheet.getCell("C7").name = "Vorname";

  sheet.getCell("C11").value = "KEGELMEISTERSCHAFT";
  sheet.getCell("C11").font = {
    bold: true,
  };
  sheet.mergeCells("C11:E11");
  sheet.getCell("C11:E11").border = {
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
    },
  };

  let row = 12;
  sheet.getCell("A" + row).value = "Club";
  sheet.getCell("A" + row).border = {
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
    },
  };
  sheet.getCell("B" + row).value = "Datum";
  sheet.getCell("B" + row).border = {
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
    },
  };
  sheet.getCell("C" + row).value = "Resultate";
  sheet.mergeCells("C" + row + ":G" + row);
  sheet.getCell("C" + row).border = {
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
    },
  };
  sheet.getCell("H" + row).value = "z Pkt.";
  sheet.getCell("H" + row).border = {
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
    },
  };
  sheet.getCell("I" + row).value = "Total";
  sheet.getCell("I" + row).border = {
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
    },
  };
  sheet.getCell("J" + row).value = "Visum";
  sheet.getCell("J" + row).border = {
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
    },
  };
  sheet.getCell("K" + row).value = "eventId";

  row = 27;
  sheet.getCell("F" + row).value = "Total Kegeln";
  sheet.mergeCells("F" + row + ":H" + row);
  sheet.getCell("F" + row + ":H" + row).border = {
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
    },
  };
  sheet.getCell("I" + row).value = "=SUM(I13:I26)";
  sheet.getCell("I" + row).border = {
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
    },
  };

  row = 29;
  sheet.getCell("C29").value = "CLUBMEISTERSCHAFT";
  sheet.getCell("C29").font = {
    bold: true,
  };
  sheet.mergeCells("C29:E29");
  sheet.getCell("C29:E29").border = {
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
    },
  };

  row = 30;
  sheet.getCell("A" + row).value = "Club";
  sheet.getCell("A" + row ).border = {
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
    },
  };
  sheet.getCell("B" + row).value = "Datum";
  sheet.getCell("B" + row ).border = {
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
    },
  };
  sheet.getCell("K" + row).value = "eventId";

  row = 12;
  dbEvents.forEach((event) => {
    row++;

    if (event.istkegeln == 1) {
      // clubevent einfache Liste
      sheet.getCell("A" + row).value = event.punkte;
      sheet.getCell("A" + row).border = {
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
        },
      };
      sheet.getCell("B" + row).value = event.datum;
      sheet.getCell("B" + row).border = {
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
        },
      };
      sheet.getCell("C" + row).border = {
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
        },
      };
      sheet.getCell("D" + row).border = {
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
        },
      };
      sheet.getCell("E" + row).border = {
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
        },
      };
      sheet.getCell("F" + row).border = {
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
        },
      };
      sheet.getCell("G" + row).border = {
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
        },
      };
      sheet.getCell("H" + row).value = event.zusatz;
      sheet.getCell("H" + row).border = {
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
        },
      };
      sheet.getCell("I" + row).value = "";
      sheet.getCell("I" + row).border = {
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
        },
      };
      sheet.getCell("J" + row).border = {
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
        },
      };
      sheet.getCell("K" + row).value = event.id;
    } else {
      // clubevent 
    }
  });
}
