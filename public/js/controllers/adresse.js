var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		db.Adressen.findAll({ where: { 			
			austritt: { [Op.gte]: new Date() }
			 }})
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	getOverviewData: function (req, res) {
		// get a json file with the following information to display on first page:
		// count of active adressen
		// count of SAM_Mitglieder
		// count of not SAM_Mitglieder
		
		var qrySelect = "SELECT 'Aktive Mitglieder' as label, count(id) as anzahl FROM adressen  WHERE `austritt` > NOW()";
		qrySelect += " UNION SELECT 'SAM Mitglieder', count(id) FROM adressen WHERE  `austritt` > NOW() and sam_mitglied = 1";
		qrySelect += " UNION SELECT 'Freimitglieder', count(id) FROM adressen WHERE  `austritt` > NOW() and sam_mitglied = 0";

		sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			})
		.then(data => res.json(data))
		.catch((e) => console.error(e));					
	},

	getOneData: function (req, res) {
		db.Adressen.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `id`, `fullname` as value FROM `adressen` WHERE `austritt` > NOW()" ;
		if (req.query.filter != null) {
			var qfield = '%' + req.query.filter.value + '%';
			qrySelect = qrySelect + " AND lower(`fullname`) like '" + qfield + "'";
		}
		qrySelect = qrySelect + " ORDER BY 2";
		
		sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).then(data => res.json(data))
		.catch((e) => console.error(e));					
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ',data);
		let endDate = new Date();
		endDate.setMonth(11);
		endDate.setDate(31);
		db.Adressen.findByPk(data.id)
		.then((adresse) =>
			//adresse.destroy()
			adresse.update({austritt: endDate})
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		if (data.austritt == "" || data.austritt == null) {
			data.austritt = "3000-01-01T00:00:00";
		}
		if (data.eintritt == "" || data.eintritt == null) {
			data.eintritt = new Date().toISOString();
		}
		console.info('insert: ',data);
		db.Adressen.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		if (data.austritt == "" || data.austritt == null) {
			data.austritt = "3000-01-01T00:00:00";
		}
		if (data.eintritt == "" || data.eintritt == null) {
			data.eintritt = new Date().toISOString();
		}
		if (data.mnr == "") {
			// insert
			console.info('insert: ',data);
			db.Adressen.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e))
		} else {
			// update
			console.info('update: ',data);
		
			db.Adressen.findByPk(data.id)
			.then((adresse) => adresse.update(data)
				.then((obj) => res.json({id: obj.id}))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
		}
	},

};