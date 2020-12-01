var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");

module.exports = {
	getData: function (req, res) {
		db.Journal.findAll(
			{ where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), req.query.jahr),
			include: [
				{ model: db.Account, as: 'fromAccount', required: true, attributes: ['id', 'order',  'name']},
				{ model: db.Account, as: 'toAccount', required: true, attributes: ['id', 'order', 'name']}
			],
			order: [
				['journalNo', 'asc'],
				['date', 'asc'],
				['from_account', 'asc'],
			]
		}
		)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getOneData: function (req, res) {
		db.Journal.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ', data);
		db.Journal.findByPk(data.id)
			.then((journal) =>
				journal.destroy()
					.then((obj) => res.json({ id: obj.id }))
					.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;

		console.info('insert: ', data);
		db.Journal.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},

	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ', data);

		db.Journal.findByPk(data.id)
			.then((journal) => journal.update(data)
				.then((obj) => res.json({ id: obj.id }))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	importJournal: async function (req, res) {
		var data = req.body;
		var filename = data.sname.replace(process.cwd(), ".");
		console.log(filename);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(filename);

		const worksheet = workbook.getWorksheet(1);
		const lastrow = worksheet.lastRow.getCell(1).row;
		console.log(`Worksheet ${worksheet.name} hat ${lastrow} Zeilen.`);

		const logWorksheet = workbook.addWorksheet("Import Log");
		logWorksheet.columns = [
			{ header: 'Timestamp', key: 'timestam', width: 10 },
			{ header: 'Type', key: 'type', width: 10 },
			{ header: 'Message', key: 'message', width: 50 }
		  ];
		
		
		// einlesen vom Kontoplan
		var qrySelect = "SELECT `id`, `level`, `order`, `name` from account order by `level`, `order`";
		var arAccount = await sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: true
			}
		)
		.catch((e) => {
			logWorksheet.addRow({'timestamp' : new Date().toUTCString(), 'type' : 'Warnung', 'message' : e});					
		});
		
		const cNr = 1
		const cDatum = 2
		const cSoll = 3
		const cHaben = 4
		const cBuchungstext = 5
		const cBetrag = 6

		let Nr, Datum, Soll, Haben, Buchungstext, Betrag, idSoll, idHaben, Meldung, fSoll, fHaben;

		worksheet.eachRow(async function (row, rowNumber) {
			if (rowNumber > 1) {
				Nr = row.getCell(cNr).value;
				Datum = row.getCell(cDatum).value;
				Soll = row.getCell(cSoll).value;
				Haben = row.getCell(cHaben).value;
				Buchungstext = row.getCell(cBuchungstext).value;
				Betrag = row.getCell(cBetrag).value;

				arAccount.forEach(element => {
					if (element.order == Soll ) {
						idSoll = element.id;
						fSoll = true;
					}
					if (element.order == Haben ) {
						idHaben = element.id;
						fHaben = true;
					}
					
					if (fHaben && fSoll)
						return;
				});	

				if (!fSoll ) {
					Meldung = "Konto " + Soll + " konnte nicht gefunden werden"
					logWorksheet.addRow({'timestamp' : new Date().toISOString(), 'type' : 'Warnung', 'message' : Meldung});
					idSoll = 43;
				}
				if (!fHaben ) {
					Meldung = "Konto " + Haben + " konnte nicht gefunden werden"
					logWorksheet.addRow({'timestamp' : new TDate().toISOString(), 'type' : 'Warnung', 'message' : Meldung});
					idHaben = 43;
				}

				var formDate;
				if ( Datum instanceof Date ) {
					const offset = Datum.getTimezoneOffset()
					Datum = new Date(Datum.getTime() - (offset*60*1000))
					formDate = Datum.toISOString().split('T')[0]
				} else {
					formDate = Datum.split('.')[2] + '-' + Datum.split('.')[1] + '-' + Datum.split('.')[0]
				}
				
				qrySelect = "INSERT INTO journal (`journalNo`, `date`, `from_account`,`to_account`,`memo`, `amount`) VALUES (";
				qrySelect += Nr + ",'" + formDate + "'," + idSoll + "," + idHaben + ",'" + Buchungstext + "'," + Betrag + ")";
				logWorksheet.addRow({'timestamp' : new Date().toString(), 'type' : 'Warnung', 'message' : qrySelect});

				await sequelize.query(qrySelect,
					{
						type: Sequelize.QueryTypes.INSERT,
						plain: false,
						logging: console.log,
						raw: true
					}
				)
				.catch((e) => {
					logWorksheet.addRow({'timestamp' : new Date().toISOString(), 'type' : 'Warnung', 'message' : e});					
				});			
			}

		})

		var filenamenew = filename.replace('.xlsx', 'imported.xlsx');
		await workbook.xlsx.writeFile(filenamenew)
		.catch((e) => {
			console.error(e);
			res.json({
			  type: "error",
			  message: e,
			});
		});

	}

};