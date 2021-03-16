var {Journal, Account} = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require('uuid');


module.exports = {
	getData: function (req, res) {
		Journal.findAll(
			{
				where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), req.query.jahr),
				include: [
					{ model: Account, as: 'fromAccount', required: true, attributes: ['id', 'order', 'name'] },
					{ model: Account, as: 'toAccount', required: true, attributes: ['id', 'order', 'name'] }
				],
				order: [
					['journalno', 'asc'],
					['date', 'asc'],
					['from_account', 'asc'],
				]
			}
		)
			.then(data => {
				let index = 0;
				for (const journal of data) {
					journal.receipt = (journal.receipt != null ? true : false);
					data.slice(index, 1, journal);
					index++;
				}
				res.json(data);
			})
			.catch((e) => console.error(e));
	},

	getAttachment: function (req, res) {
		Journal.findByPk(req.query.id)
			.then(data => {
				if (data.receipt != null) {
					const filename = 'uploads/' + uuid() + '-' + data.id + '.pdf';
					const pathname = path.join(__dirname, '../../');
					console.log(pathname + filename);
					fs.writeFileSync(pathname + filename, Buffer.concat([data.receipt]));

					res.json({filename: filename});
				} else {
					res.json({filename: undefined})
				}
			})
			.catch((e) => console.error(e));

	},

	getOneData: function (req, res) {
		Journal.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ', data);
		Journal.findByPk(data.id)
			.then((journal) =>
				journal.destroy()
					.then((obj) => res.json({ id: obj.id }))
					.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	addData: async function (req, res) {
		var data = req.body;

		console.info('insert: ', data);
		Journal.create(data)
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e));
	},

	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ', data);

		Journal.findByPk(data.id)
			.then((journal) => journal.update(data, {fields: ["from_account", "to_account", "journalno", "date", "memo", "amount", "status"]})
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

				Journal.update({receipt: pdfFile}, {where: {id: data.id}})
					.then(resp => res.json(resp))
					.catch(e => console.error(e));						
			});
		} else {
			res.json({type: "error", message: "Error while reading the file"});
		}
	},

	delAttachment: function (req, res) {
		const data = req.body;

		Journal.update({receipt: null}, {where: {id: data.id}})
			.then(resp => res.json(resp))
			.catch(e => console.error(e));
			
	},
	
	getAccData: function (req, res) {
		Promise.all([
			Journal.findAll({
				attributes: [
					"id", "journalno", "date", "memo", "amount"],
				where: [{"from_account" : req.query.acc},
						Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr)],
				include: { model: Account, as: 'fromAccount', required: true }
			}),
			Journal.findAll({
				attributes: [
					"id", "journalno", "date", "memo", "amount" ],
				where: [{"to_account" : req.query.acc},
						Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr)],
				include: { model: Account, as: 'toAccount', required: true }
			})
		])
		.then((modelReturn) => {
			var arPreData = modelReturn.flat();
			var arData = [];
			for (let index = 0; index < arPreData.length; index++) {
				const element = arPreData[index];
				var record = {id : element.id, journalno : element.journalno, date: element.date, memo: element.memo}

				if (element.fromAccount == null) {
					record.account = element.toAccount.order + " " + element.toAccount.name
					record.haben = element.amount
					record.soll = 0
				} else {
					record.account = element.fromAccount.order + " " + element.fromAccount.name
					record.soll = element.amount
					record.haben = 0
				}
				arData.push(record);
			}
			res.json(arData);
		})
		.catch((err) => console.error(err));
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

				qrySelect = "INSERT INTO journal (`journalno`, `date`, `from_account`,`to_account`,`memo`, `amount`) VALUES (";
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