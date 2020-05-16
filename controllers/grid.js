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
		db.Adressen.findByPk(req.params.id)
			.then((data) =>
				data.austritt = Serialize.NOW)
			.then((adresse) =>
				//adresse.destroy()
				adresse.update(data))
			.then(() =>
				res.json({}));
	},

	addData: function (req, res) {
		const data = req.body;
		// force null values
		if (!data.anrede)
			data.anrede = 1;

		db.Adressen.create(req.body).then((obj) =>
			res.json({ id: obj.id }));
	},
	updateData: function (req, res) {
		const data = req.body;
		// force null values
		if (!data.anrede_id)
			data.anrede_id = 1;

		db.Adressen.findByPk(req.params.id)
			.then((adresse) =>
				adresse.update(data))
			.then(() =>
				res.json({}));
	}
};