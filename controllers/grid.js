var db = require("../db");
const { Op, Serialize } = require("sequelize");

module.exports = {
	getData: function (req, res) {
		db.Adressen.findAll({ where: { 
			[Op.or]: [ 
			{austritt: { [Op.eq]: null } },
			{austritt: { [Op.gte]: new Date() }}]
			 }}).then(data => res.json(data));
	},


	removeData: function (req, res) {
		const data = req.body;
		console.info('removeDate:',data);
		db.Adressen.findByPk(req.params.id)
			.then((data) =>
				data.austritt = new Date())
			.then((adresse) =>
				//adresse.destroy()
				adresse.update(data))
			.then(() =>
				res.json(data));
	},

	addData: function (req, res) {
		const data = req.body;
		// force null values
		if (!data.anrede)
			data.anrede = 1;

		console.info('addDate:',data);
		db.Adressen.create(req.body).then((obj) =>
			res.json({ id: obj.id }));
	},
	updateData: function (req, res) {
		const data = req.body;
		// force null values
		if (!data.anrede_id)
			data.anrede_id = 1;

		console.info('updateDate:',data);
		db.Adressen.findByPk(req.params.id)
		.then((adresse) =>
			adresse.update(data))
		.then(() =>
			res.json({}));
	},

};