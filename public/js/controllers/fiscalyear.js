var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");

module.exports = {
	getData: function (req, res) {		
		db.FiscalYear.findAll({order: [['year', 'asc']]})
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	getOneData: function (req, res) {
		db.FiscalYear.findOne({ where: { 			
			year: req.query.year }
			})
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `year` as id, CONCAT(`name`,' - ', ";
		qrySelect += "(CASE WHEN `state`= 1 THEN 'offen' WHEN `state`= 2 THEN 'prov. abgeschlossen' ELSE 'abgeschlossen' END)) as value"; 
		qrySelect += " FROM `fiscalyear` " ;
		if (req.query.filter != null) {
			var qfield = '%' + req.query.filter.value + '%';
			qrySelect = qrySelect + " WHERE lower(`name`) like '" + qfield + "'";
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
		db.FiscalYear.findByPk(data.id)
		.then((fiscalyear) =>
			fiscalyear.update({status: 0})
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.FiscalYear.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ',data);
	
		db.FiscalYear.findByPk(data.id)
		.then((fiscalyear) => fiscalyear.update(data)
			.then((obj) => res.json({id: obj.id}))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

};