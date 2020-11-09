var db = require("../db");
const { Op, Sequelize } = require("sequelize");

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

};