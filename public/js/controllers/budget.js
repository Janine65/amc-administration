var db = require("../db");
const { Budget, Account } = require("../db")

module.exports = {
	getData: function (req, res) {
		Budget.findAll({
			where: { 'year': req.query.jahr },
			include: [
				{ model: Account, as: 'acc', required: true, attributes: ["id", "level", "order", "name", "status"] }
			]
		})
		.then(data => {
			res.json(data);
		})
		.catch((e) => console.error(e));
	},

	getOneData: function (req, res) {
		Budget.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ', data);
		Budget.findByPk(data.id)
			.then((budget) =>
				budget.destroy()
					.then((obj) => res.json({ id: obj.id }))
					.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	addData: async function (req, res) {
		var data = req.body;
		console.info('insert: ', data);

		Budget.create(data)
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e));
			
	},

	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ', data);

		Budget.findByPk(data.id)
			.then((budget) => budget.update(data)
				.then((obj) => res.json(obj))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},


};