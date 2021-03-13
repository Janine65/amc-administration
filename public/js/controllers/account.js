var {Journal, Account, Budget} = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: async function (req, res) {
		var arJournalIds = [];

		var arfromAcc = await global.sequelize.query("SELECT DISTINCT from_account FROM journal WHERE year(date) = ?",
			{
				replacements: [req.query.jahr],
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		)
			.catch((e) => console.error(e));

		for (let index = 0; index < arfromAcc.length; index++) {
			const element = arfromAcc[index];
			arJournalIds.push(element.from_account);
		}

		arfromAcc = await global.sequelize.query("SELECT DISTINCT to_account FROM journal WHERE year(date) = ?",
			{
				replacements: [req.query.jahr],
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).catch((e) => console.error(e));
		for (let index = 0; index < arfromAcc.length; index++) {
			const element = arfromAcc[index];
			arJournalIds.push(element.to_account);
		}

		var arAccount = [];

		if (req.query.all == 0) {
			arAccount = await Account.findAll(
				{
					where: {
						[Op.and]: [
							{ "order": { [Op.gt]: 10 } },
							{ "status": 1 },
							{ "id": { [Op.in]: arJournalIds } }
						]
					},
					order: [["level", "ASC"], ["order", "ASC"]]
				}).catch((e) => console.error(e));
		} else {
			arAccount = await Account.findAll(
				{
					where: { "order": { [Op.gt]: 10 } },
					order: [["level", "ASC"], ["order", "ASC"]]
				}).catch((e) => console.error(e));
		}
		res.json(arAccount);
	},

	getOneData: function (req, res) {
		Account.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getOneDataByOrder: function (req, res) {
		Account.count({ where: { "order": req.query.order } })
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function (req, res) {
		Account.findAll({
			attributes: ["id", [Sequelize.fn('CONCAT', Sequelize.col("name"), ' ', Sequelize.col("order")), "name"]],
			where: [
				Sequelize.where(Sequelize.fn('LOWER', Sequelize.col("name")), { [Op.substring]: (req.query.filter != null ? req.query.filter.value : '') }),
				{ "order": { [Op.ne]: Sequelize.col("level") } },
				{ "status": 1 }
			],
			order: [["level", "ASC"], ["order", "ASC"]]
		})
			.then(function (data) {
				var arReturn = [];
				for (let index = 0; index < data.length; index++) {
					const element = data[index];
					arReturn.push({ id: element.id, value: '<span class=\"small\">' + element.name + '</span>' });
				}
				res.json(arReturn);
			})
			.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ', data);
		Account.create(data)
			.then((obj) => res.json(obj))
			.catch((e) => res.json({ type: "error", message: e }));
	},

	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ', data);

		Account.findByPk(data.id)
			.then((account) => account.update(data)
				.then((obj) => res.json(obj))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	getAccountSummary: async function (req, res) {
		var arData = [];
		var arBudget = await Budget.findAll({
			attributes: ["amount"],
			where: { 'year': req.query.jahr },
			include: [
				{ model: Account, as: 'acc', required: true, attributes: ["id", "level", "order", "name", "status"] }
			]
		})
			.catch((e) => console.error(e));

		Journal.findAll({
			attributes: [[Sequelize.fn('sum', Sequelize.col("amount")), "amount"]],
			where: Sequelize.where(Sequelize.fn('year', Sequelize.col("date")), req.query.jahr),
			include: [
				{
					model: Account, as: 'fromAccount', required: true,
					attributes: ["id", "level", "order", "name", "status"]
				}],
			group: ["fromAccount.id", "fromAccount.level", "fromAccount.order", "fromAccount.name", "fromAccount.status"],
			order: [["fromAccount", "level", "ASC"], ["fromAccount", "order", "ASC"]]
		})
			.then(function (data) {

				Journal.findAll({
					attributes: [[Sequelize.fn('sum', Sequelize.col("amount")), "amount"]],
					where: Sequelize.where(Sequelize.fn('year', Sequelize.col("date")), req.query.jahr),
					include: [
						{ model: Account, as: 'toAccount', required: true, attributes: ["id", "level", "order", "name", "status"] }],
					group: ["toAccount.id", "toAccount.level", "toAccount.order", "toAccount.name", "toAccount.status"],
					order: [["toAccount", "level", "ASC"], ["toAccount", "order", "ASC"]]
				})
					.then(function (data2) {
						for (let ind2 = 0; ind2 < data.length; ind2++) {
							var record = {}
							record.id = data[ind2].fromAccount.id
							record.name = data[ind2].fromAccount.name
							record.level = data[ind2].fromAccount.level
							record.order = data[ind2].fromAccount.order
							record.status = data[ind2].fromAccount.status
							record.budget = 0
							record.diff = 0
							record.$css = (data[ind2].fromAccount.status ? "active" : "inactive")
							var found = data2.findIndex(acc => acc.toAccount.id == data[ind2].fromAccount.id);
							if (found >= 0) {
								const acc2 = data2[found];
								switch (data[ind2].fromAccount.level) {
									case 1:
									case 4:
										record.amount = eval(data[ind2].amount - acc2.amount);
										break;
									case 2:
									case 6:
										record.amount = eval(acc2.amount - data[ind2].amount);
										break;
								}
								data2.splice(found, 1);
							} else {
								switch (data[ind2].fromAccount.level) {
									case 1:
									case 4:
										record.amount = eval(data[ind2].amount * 1);
										break;
									case 2:
									case 6:
										record.amount = eval(data[ind2].amount * -1);
										break;
								}
							}
							arData.push(record);
						}
						for (let ind2 = 0; ind2 < data2.length; ind2++) {
							record = {}
							record.id = data2[ind2].toAccount.id
							record.name = data2[ind2].toAccount.name
							record.level = data2[ind2].toAccount.level
							record.order = data2[ind2].toAccount.order
							record.status = data2[ind2].toAccount.status
							record.budget = 0
							record.diff = 0
							record.$css = (data2[ind2].toAccount.status ? "active" : "inactive")
							switch (data2[ind2].toAccount.level) {
								case 1:
								case 4:
									record.amount = eval(data2[ind2].amount * -11);
									break;
								case 2:
								case 6:
									record.amount = eval(data2[ind2].amount * 1);
									break;
							}
							arData.push(record);
						}

						for (let ind2 = 0; ind2 < arData.length; ind2++) {
							found = arBudget.findIndex(element => element.acc.id == arData[ind2].id);
							record = arData[ind2];
							if (found >= 0) {
								const acc = arBudget[found];
								record.budget = eval(acc.amount * 1);
								record.diff = record.budget - record.amount;
								arBudget.splice(found, 1);
							} else {
								record.diff = arData[ind2].budget - arData[ind2].amount;
							}
							//arData.splice(ind2, 1, record);
						}

						for (let ind2 = 0; ind2 < arBudget.length; ind2++) {
							record = {};
							record.id = arBudget[ind2].acc.id
							record.name = arBudget[ind2].acc.name
							record.level = arBudget[ind2].acc.level
							record.order = arBudget[ind2].acc.order
							record.status = arBudget[ind2].acc.status
							record.$css = (record.status ? "active" : "inactive")

							record.amount = 0;
							record.budget = eval(arBudget[ind2].amount * 1)
							record.diff = record.budget;
							arData.push(record);
						}

						arData.sort((a, b) => {
							if (a.level < b.level)
								return -1
							if (a.level == b.level && a.order <= b.order)
								return -1
							return 1
						});
						console.log(arData);
						res.json(arData);
					})
					.catch((e) => console.error(e));
			})
			.catch((e) => console.error(e));
	},

};