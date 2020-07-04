var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		db.Anlaesse.findAll().then(data => res.json(data));		
	},

	getOverviewData: function (req, res) {
		// get a json file with the following information to display on first page:
		// count of anlaesse im system_param jahr
		// count of SAM_Mitglieder
		// count of not SAM_Mitglieder
		
		var qrySelect = "SELECT 'Anzahl Anlässe im aktuellen Jahr' as label, count(id) as value from clubmeisterschaft where YEAR(`datum`) = (SELECT `systemparameter`.`Wert_Zahl` FROM `systemparameter` WHERE `systemparameter`.`Feld` = 'CLUBJAHR')";
		qrySelect += " UNION SELECT 'Anzahl zukünftiger Anlässe', count(id) from clubmeisterschaft where datum > NOW()";

		sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).then(data => res.json(data));					
	},

	getOneData: function (req, res) {
		db.Anlaesse.findByPk(req.param.id).then(data => res.json(data));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `id`, `fullname` as value FROM `clubmeisterschaft` WHERE YEAR(`datum`) < YEAR£(NOW())" ;
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
		).then(data => res.json(data));					
		},

	removeData: function (req, res) {
		const data = req.body;
		if (data == undefined) {
			throw "Record not correct";
		}
		console.info('delete: ',data);
		db.Anlaesse.findByPk(data.id)
		.then((anlass) =>
			anlass.destroy())
		.catch((e) => console.log(e));
},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.Anlaesse.create(data).then((obj) =>
			res.json({ id: obj.id }));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		if (data.id == 0 || data.id == null) {
			// insert
			console.info('insert: anlass',data);
			db.Anlaesse.create(data).then((obj) =>
				res.json({ id: obj.id }));
		} else {
			// update
			console.info('update: ',data);
		
			db.Anlaesse.findByPk(data.id)
			.then((anlass) => anlass.update(data))
			.catch((e) => console.error(e));
		}
	},

};