var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		db.Adressen.findAll({ where: { 			
			austritt: { [Op.gte]: new Date() }
			 }}).then(data => res.json(data));		
	},

	getOneData: function (req, res) {
		db.Adressen.findByPk(req.param.id).then(data => res.json(data));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `id`, CONCAT(`vorname`, ' ', `name`) as value FROM `Adressen` WHERE `austritt` > NOW()" ;
		if (req.query.filter != null) {
			var qfield = '%' + req.query.filter.value + '%';
			qrySelect = qrySelect + " AND lower(CONCAT(`vorname`, ' ', `name`)) like '" + qfield + "'";
		}
		qrySelect = qrySelect + " ORDER BY 2";
		
		sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).then(data => res.json(data));					
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
			
		db.Adressen.create(data).then((obj) =>
			res.json({ id: obj.id }));
	},
	
	updateData: function (req, res) {
		const data = req.body;
		console.info('update: ',res, req);
		// getDirtyValues
		db.Adressen.findByPk(req.params.id)
			.then((adresse) => {
				console.info('update - adresse: ',adresse);
				//TODO
				//if (data.mnr_sam = "") data.mnr_sam = null;				
				//if (adresse.name != data.name) adresse.name = data.name;
				//if (adresse.vorname != data.vorname) adresse.vorname = data.vorname;
				console.info('update2: ',data);

				if (adresse.update(data))
					res.json({});
		});
	},

};