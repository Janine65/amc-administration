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
		console.info('delete: ',data);
		let endDate = new Date();
		endDate.setMonth(11);
		endDate.setDate(31);
		db.Adressen.findByPk(req.params.id)
		.then((adresse) =>
			//adresse.destroy()
			adresse.update({austritt: endDate}))
		.then(() =>
			res.json({}));
},

	addData: function (req, res) {
		const data = req.body;
		console.info('insert: ',data);
		// force null values
		if (!data.anrede)
			data.anrede = 1;

		db.Adressen.create(data).then((obj) =>
			res.json({ id: obj.id }));
	},
	
	updateData: function (req, res) {
		const data = req.body;
		console.info('update: ',data);
		db.Adressen.findByPk(req.params.id)
			.then((adresse) => {
				console.info('adresse: ',adresse);
				if (adresse.update(data))
					res.json({});
		});
	},

};