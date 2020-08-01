var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {	
			
		db.Meisterschaft.findAll({
			where: {eventId: { [Op.eq]: req.query.eventId }},
			include: [
				{ model: db.Adressen, as: 'teilnehmer', required: true, attributes: ['id', 'fullname']}
			  ],
			  order: [
			 	 ['teilnehmer', 'fullname', 'asc']
			 ]
		}).then(data => res.json(data));		
	},

	getOneData: function (req, res) {
		db.Meisterschaft.findOne({
			where: {id: { [Op.eq]: req.query.id}},
			include: [
				{ model: db.Adressen, as: 'teilnehmer', required: true, attributes: ['id', 'fullname']}
			  ]
		}).then(data => res.json(data));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `id`, `fullname` as value FROM `adressen` WHERE `austritt` > NOW()" ;
		if (req.query.filter != null) {
			var qfield = '%' + req.query.filter.value + '%';
			qrySelect = qrySelect + " AND lower(`fullname`) like '" + qfield + "'";
		}
		qrySelect = qrySelect + " ORDER BY fullname asc";
		
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
		db.Meisterschaft.findByPk(data.id)
		.then((eintrag) => eintrag.destroy()
			.then((obj) => res.json({id: obj.id}))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.Meisterschaft.create(data)
			.then((obj) => res.json(obj.id))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		// update
		console.info('update: ',data);

		db.Meisterschaft.findByPk(data.id)
		.then((eintrag) => eintrag.update(data)
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

};