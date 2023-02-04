const { Journal, Account, Receipt, JournalReceipt } = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const fs = require("fs");
const { v4: uuid } = require('uuid');


async function getData(req, res) {
	Journal.findAll(
		{
			attributes: [
				'id', 'date', 'memo', 'journalno', 'amount', 'status',
				[Sequelize.fn("COUNT", Sequelize.col("journal2receipt.receiptid")), "receipts"]
			],
			where: Sequelize.where(sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr),
			include: [
				{ model: Account, as: 'fromAccount', required: true, attributes: ['id', 'order', 'name'] },
				{ model: Account, as: 'toAccount', required: true, attributes: ['id', 'order', 'name'] },
				{ model: JournalReceipt, as: 'journal2receipt', required: false, attributes: [] }
			],
			group: ['journal.id', 'journal.date', 'journal.memo', 'journal.journalno',
				'journal.amount', 'journal.status',
				'fromAccount.id', 'fromAccount.order', 'fromAccount.name',
				'toAccount.id', 'toAccount.order', 'toAccount.name'
			],
			order: [
				['journalno', 'asc'],
				['date', 'asc'],
				['from_account', 'asc'],
			]
		}
	)
		.then(data => {
			res.json(data);
		})
		.catch((e) => console.error(e));
}

async function getAllAttachment(req, res) {
	Receipt.findAll(
		{
			where: { jahr: req.query.jahr }
		}
	)
		.then(data => {
			data.forEach(rec => {
				const pathname = global.documents + req.query.jahr + '/';
				try {
					fs.copyFileSync(pathname + rec.receipt, global.uploads + rec.receipt);
					rec.receipt = global.public + rec.receipt
				} catch (ex) {
					console.log(pathname + rec.receipt + ': File not found');
					rec.receipt = 'File not found: ' + rec.receipt
				}
			});
			res.json(data);
		})
		.catch((e) => console.error(e));


}

async function getAttachment(req, res) {
	// Hier müssen nun die Belege gelesen werden und nicht nur das Attribut auf dem Journal
	Receipt.findAll(
		{
			attributes: [
				'id', 'receipt'
			],
			include: [
				{ model: JournalReceipt, as: 'receipt2journal', required: true, attributes: [], where: { 'journalid': req.query.id } }
			]
		}
	)
		.then(data => {
			data.forEach(rec => {
				const pathname = global.documents + req.query.jahr + '/';
				console.log(pathname + rec.receipt);
				try {
					fs.copyFileSync(pathname + rec.receipt, global.uploads + rec.receipt);
					rec.receipt = global.public + rec.receipt
				} catch (ex) {
					rec.receipt = 'File not found: ' + rec.receipt
				}
			});
			res.json(data);
		})
		.catch((e) => console.error(e));

}

async function getOneData(req, res) {
	Journal.findByPk(req.param.id)
		.then(data => res.json(data))
		.catch((e) => console.error(e));
}

async function removeData(req, res) {
	const data = req.body;
	console.info('delete: ', data);
	Journal.findByPk(data.id)
		.then((journal) =>
			journal.destroy()
				.then((obj) => res.json({ id: obj.id }))
				.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
}

async function addData(req, res) {
	let data = req.body;
	data.id = null;
	console.info('insert: ', data);
	Journal.create(data)
		.then((obj) => res.json(obj))
		.catch((e) => console.error(e));
}

async function updateData(req, res) {
	let data = req.body;
	console.info('update: ', data);

	Journal.findByPk(data.id)
		.then((journal) => journal.update(data, { fields: ["from_account", "to_account", "journalno", "date", "memo", "amount", "status"] })
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
}

async function addAttachment(req, res) {
	const data = req.body;

	if (data.uploadFiles == undefined) {
		// nothing to do -> return
		res.json({ type: "error", message: "No file to store in database" });
		return;
	}

	const listUploadFiles = data.uploadFiles.split(',')
	let sJahr = new Date(data.date).getFullYear();
	const path = global.documents + sJahr + '/';
	let payload = {
		status: 'error',
		message: '',
		files: []
	}

	listUploadFiles.forEach(element => {
		const receipt = 'receipt/' + element

		let filename = global.uploads + element;

		if (fs.existsSync(filename)) {
			fs.copyFileSync(filename, );
			fs.chmod(path + receipt + filename, '0640', err => {
				if (err) {
					payload.message = "Error while changing the mode of the file - " + err.message
				}
			  });
			let newReceipt = Receipt.build({ receipt: receipt })
			newReceipt.save({ fields: ['receipt'] })
				.then(result => {
					let newJourRec = JournalReceipt.build({ journalid: data.id, receiptid: result.id })
					newJourRec.save({ fields: ['journalid', 'receiptid'] })
						.then(rec => payload.files.push(element))
						.catch(e => payload.message += "Error while saving new journal_receipt " + element)
				})
				.catch(e => payload.message += "Error while saving new receipt " + element)
		} else {
			payload.message += "Error while reading the file " + element;
		}
	});

	if (payload.message == '' && payload.files.length == listUploadFiles.length)
		payload.status = 'ok'

	res.json(payload);
}

async function delAttachment(req, res) {
	const data = req.body;

	JournalReceipt.findOne({
		where: [
			{ journalid: data.journalid },
			{ receiptid: data.receiptid }
		]
	}).then(resp => resp.destroy()
		.then(ret => res.json({ type: "info", message: "Attachment deleted" }))
		.catch(e => console.error(e)))
		.catch(e => console.error(e))
}

async function getAccData(req, res) {
	Promise.all([
		Journal.findAll({
			attributes: [
				"id", "journalno", "date", "memo", "amount"],
			where: [{ "from_account": req.query.acc },
			Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr)],
			include: { model: Account, as: 'fromAccount', required: true }
		}),
		Journal.findAll({
			attributes: [
				"id", "journalno", "date", "memo", "amount"],
			where: [{ "to_account": req.query.acc },
			Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr)],
			include: { model: Account, as: 'toAccount', required: true }
		})
	])
		.then((modelReturn) => {
			let arPreData = modelReturn.flat();
			let arData = [];
			for (let index = 0; index < arPreData.length; index++) {
				const element = arPreData[index];
				let record = { id: element.id, journalno: element.journalno, date: element.date, memo: element.memo }

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
}

async function importJournal(req, res) {
	let data = req.body;
	let filename = data.sname.replace(process.cwd(), ".");
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


	let arInsData = [];

	// einlesen vom Kontoplan
	let arAccount = await Account.findAll({
		order: ["level", "order"]
	})
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

			let formDate;
			if (Datum instanceof Date) {
				const offset = Datum.getTimezoneOffset()
				Datum = new Date(Datum.getTime() - (offset * 60 * 1000))
				formDate = Datum.toISOString().split('T')[0]
			} else {
				formDate = Datum.split('.')[2] + '-' + Datum.split('.')[1] + '-' + Datum.split('.')[0]
			}

			let record = { "journalno": Nr, "date": formDate, "from_account": idSoll, "to_account": idHaben, "memo": Buchungstext, "amount": Betrag };
			arInsData.push(record);
			logWorksheet.addRow({ 'timestamp': new Date().toString(), 'type': 'Warnung', 'message': record.toString() });
		}
	})

	await Journal.bulkCreate(arInsData,
		{ fields: ["journalno", "date", "from_account", "to_account", "memo", "amount"] })
		.catch((e) => {
			logWorksheet.addRow({ 'timestamp': new Date().toUTCString(), 'type': 'Warnung', 'message': e });
		});

	let filenamenew = filename.replace('.xlsx', 'imported.xlsx');
	await workbook.xlsx.writeFile(filenamenew)
		.catch((e) => {
			console.error(e);
			res.json({
				type: "error",
				message: e,
			});
		});

}

module.exports = {
	getData: getData,
	getAttachment: getAttachment,
	getOneData: getOneData,
	removeData: removeData,
	addData: addData,
	updateData: updateData,
	getAllAttachment: getAllAttachment,
	addAttachment: addAttachment,
	delAttachment: delAttachment,
	getAccData: getAccData,
	importJournal: importJournal
};