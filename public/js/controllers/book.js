var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		db.Book.findAll({order: [['level', 'asc'],['order', 'asc']]})
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	getOneData: function (req, res) {
		db.Book.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `id`, CONCAT(`order`,' ',`name`) as value"; 
		qrySelect += " FROM `book` WHERE `status` = 1" ;
		if (req.query.filter != null) {
			var qfield = '%' + req.query.filter.value + '%';
			qrySelect = qrySelect + " AND lower(`name`) like '" + qfield + "'";
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
		db.Book.findByPk(data.id)
		.then((book) =>
			book.update({status: 0})
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.Book.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ',data);
	
		db.Book.findByPk(data.id)
		.then((book) => book.update(data)
			.then((obj) => res.json({id: obj.id}))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

};