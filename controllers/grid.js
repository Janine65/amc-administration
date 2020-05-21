var db = require("../db");
const { Op, Serialize } = require("sequelize");

module.exports = {
	getData: function (req, res) {
		//findAndCountAll
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
				console.info('update - adresse: ',adresse);
				//TODO
				if (data.mnr_sam = "") data.mnr_sam = null;				
				//if (adresse.name != data.name) adresse.name = data.name;
				//if (adresse.vorname != data.vorname) adresse.vorname = data.vorname;
				console.info('update2: ',data);

				if (adresse.update(data))
					res.json({});
		});
	},

};