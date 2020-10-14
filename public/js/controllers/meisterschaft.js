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

	getMitgliedData: function(req, res) {
		var qrySelect = "SELECT a.datum, a.name, m.punkte, (m.wurf1 + m.wurf2 + m.wurf3 + m.wurf4 + m.wurf5 + m.zusatz) as total_kegel, m.streichresultat";
		qrySelect += " FROM meisterschaft m join anlaesse a on (m.eventid = a.id)";
		qrySelect += " WHERE m.mitgliedid = " + req.query.id;
		qrySelect += " AND year(a.datum) = " + global.Parameter.get("CLUBJAHR");
		qrySelect += " ORDER BY datum"

		sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).then(data => res.json(data));					

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