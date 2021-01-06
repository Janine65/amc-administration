var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

module.exports = {
	getData: function (req, res) {
		db.Journal.findAll(
			{
				where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), req.query.jahr),
				include: [
					{ model: db.Account, as: 'fromAccount', required: true, attributes: ['id', 'order', 'name'] },
					{ model: db.Account, as: 'toAccount', required: true, attributes: ['id', 'order', 'name'] }
				],
				order: [
					['journalNo', 'asc'],
					['date', 'asc'],
					['from_account', 'asc'],
				]
			}
		)
			.then(data => {
				for (const journal of data) {
					if (journal.receipt != undefined) {
						const filename = path.join(__dirname, '../../uploads/Attachment-' + journal.id + '.pdf');
						console.log(filename);
						fs.writeFileSync(filename, Buffer.concat([journal.receipt]));
						journal.filename = filename;
						journal.receipt = null;
					}
				}
				res.json(data);
			})
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

	addData: async function (req, res) {
		var data = req.body;

		console.info('insert: ', data);
		db.Journal.create(data)
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e));
	},

	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ', data);

		db.Journal.findByPk(data.id)
			.then((journal) => journal.update(data)
				.then((obj) => res.json(obj))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	addAttachment: function (req, res) {
		const data = req.body;

		if (data.uploadFiles == undefined) {
			// nothing to do -> return
			res.json({type: "error", message: "No file to store in database"});
			return;
		}
		var filename = path.join(__dirname, '../../../public/uploads/' + data.uploadFiles)

		if (fs.existsSync(filename)) {
			fs.readFile(filename, (err, pdfFile) => {
				if (err)
					throw err;

				db.Journal.update({receipt: pdfFile}, {where: {id: data.id}})
					.then(resp => res.json(resp))
					.catch(e => console.error(e));						
			});
		} else {
			res.json({type: "error", message: "Error while reading the file"});
		}
	},

	delAttachment: function (req, res) {
		const data = req.body;

		db.Journal.update({receipt: null}, {where: {id: data.id}})
			.then(resp => res.json(resp))
			.catch(e => console.error(e));
			
	},
	
	getAccData: function (req, res) {
		var qrySelect = "SELECT j.id, j.journalNo, concat(acc.order, ' ', acc.name) as account, j.date, j.memo, j.amount as soll, null as haben";
		qrySelect += " FROM journal j, account acc"
		qrySelect += " WHERE j.to_account = acc.id and j.from_account = " + req.query.acc;
		qrySelect += " AND year(j.date) = " + req.query.jahr;
		qrySelect += " UNION SELECT j.id, j.journalNo, concat(acc.order, ' ', acc.name) as account, j.date, j.memo, null, j.amount";
		qrySelect += " FROM journal j, account acc"
		qrySelect += " WHERE j.from_account = acc.id and j.to_account = " + req.query.acc;
		qrySelect += " AND year(j.date) = " + req.query.jahr;
		qrySelect += " ORDER BY 2, 4"

		sequelize.query(qrySelect,
			{
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: true
			}
		)
			.then((data) => res.json(data))
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
				logWorksheet.addRow({ 'timestamp': new Date().toUTCString(), 'type': 'Warnung', 'message': e });
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

				for (let ind2 = 0; ind2 < arAccount.length; ind2++) {
					const element = arAccount[ind2];
					if (element.order == Soll) {
						idSoll = element.id;
						fSoll = true;
					}
					if (element.order == Haben) {
						idHaben = element.id;
						fHaben = true;
					}

					if (fHaben && fSoll)
						return;
				}

				if (!fSoll) {
					Meldung = "Konto " + Soll + " konnte nicht gefunden werden"
					logWorksheet.addRow({ 'timestamp': new Date().toISOString(), 'type': 'Warnung', 'message': Meldung });
					idSoll = 43;
				}
				if (!fHaben) {
					Meldung = "Konto " + Haben + " konnte nicht gefunden werden"
					logWorksheet.addRow({ 'timestamp': new TDate().toISOString(), 'type': 'Warnung', 'message': Meldung });
					idHaben = 43;
				}

				var formDate;
				if (Datum instanceof Date) {
					const offset = Datum.getTimezoneOffset()
					Datum = new Date(Datum.getTime() - (offset * 60 * 1000))
					formDate = Datum.toISOString().split('T')[0]
				} else {
					formDate = Datum.split('.')[2] + '-' + Datum.split('.')[1] + '-' + Datum.split('.')[0]
				}

				qrySelect = "INSERT INTO journal (`journalNo`, `date`, `from_account`,`to_account`,`memo`, `amount`) VALUES (";
				qrySelect += Nr + ",'" + formDate + "'," + idSoll + "," + idHaben + ",'" + Buchungstext + "'," + Betrag + ")";
				logWorksheet.addRow({ 'timestamp': new Date().toString(), 'type': 'Warnung', 'message': qrySelect });

				await sequelize.query(qrySelect,
					{
						type: Sequelize.QueryTypes.INSERT,
						plain: false,
						logging: console.log,
						raw: true
					}
				)
					.catch((e) => {
						logWorksheet.addRow({ 'timestamp': new Date().toISOString(), 'type': 'Warnung', 'message': e });
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