var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		/*
 		db.Anlaesse.findAll({
 			where: {datum: { [Op.gte]: new Date('01.01.'+(global.Parameter.get('CLUBJAHR') - 1 )) }},
 			//attributes: { inlcude: ['longname']},
 			include: [
 //				{ model: db.Anlaesse, as: 'linkedEvent', required: false, attributes: ['longname']}
 				{ model: db.Anlaesse, as: 'linkedEvent', required: false, attributes: { inlcude: ['longname']}}
 			 ],
 			 order: [
 				 ['datum', 'asc']
 			 ]
		 }).then(data => res.json(data));		
		 */
		 /*
				 SELECT `anlaesse`.`id`, `anlaesse`.`datum`, `anlaesse`.`name`, `anlaesse`.`beschreibung`, `anlaesse`.`punkte`, `anlaesse`.`istkegeln`, `anlaesse`.`nachkegeln`, `anlaesse`.`gaeste`, `anlaesse`.`anlaesseId`, `anlaesse`.`status`, `anlaesse`.`createdAt`, `anlaesse`.`updatedAt`, 
				 `linkedEvent`.`id` AS `linkedEvent.id`, `linkedEvent`.`longname` AS `linkedEvent.longname`
				  FROM `anlaesse` AS `anlaesse` LEFT OUTER JOIN `anlaesse` AS `linkedEvent` ON `anlaesse`.`anlaesseId` = `linkedEvent`.`id` 
				  WHERE `anlaesse`.`datum` >= '2019-01-01' ORDER BY `anlaesse`.`datum` ASC;
		 */
		 var qrySelect = "SELECT `anlaesse`.`id`, `anlaesse`.`datum`, `anlaesse`.`name`, `anlaesse`.`beschreibung`, `anlaesse`.`punkte`, `anlaesse`.`istkegeln`, `anlaesse`.`nachkegeln`, `anlaesse`.`istsamanlass`, `anlaesse`.`gaeste`, `anlaesse`.`anlaesseId`, `anlaesse`.`status`, `anlaesse`.`createdAt`, `anlaesse`.`updatedAt`, `linkedEvent`.`longname` as 'vorjahr'";
		 qrySelect += " FROM `anlaesse` AS `anlaesse` LEFT OUTER JOIN `anlaesse` AS `linkedEvent` ON `anlaesse`.`anlaesseId` = `linkedEvent`.`id`";
		 qrySelect += " WHERE YEAR(`anlaesse`.`datum`) >= ";
		 qrySelect += global.Parameter.get('CLUBJAHR') - 1;
		 qrySelect += " ORDER BY `anlaesse`.`datum` ASC;"

		 sequelize.query(qrySelect, 
		 	{ 
		 		type: Sequelize.QueryTypes.SELECT,
		 		plain: false,
		 		logging: console.log,
		 		raw: false
		 	}
		 ).then(data => res.json(data));					
	},

	getOverviewData: function (req, res) {
		// get a json file with the following information to display on first page:
		// count of anlaesse im system_param jahr
		// count of SAM_Mitglieder
		// count of not SAM_Mitglieder
		
		var qrySelect = "SELECT 'Total Anlässe' as label, count(id) as value from anlaesse where status = 1 and YEAR(`datum`) = ";
		qrySelect += global.Parameter.get('CLUBJAHR') + " AND istsamanlass = 0 AND nachkegeln = 0";
		qrySelect += " UNION SELECT 'Zukünftige Anlässe', count(id) from anlaesse where status = 1 and datum > NOW() and YEAR(`datum`) = ";
		qrySelect += global.Parameter.get('CLUBJAHR') + " AND istsamanlass = 0 AND nachkegeln = 0";

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
		var qrySelect = "SELECT `id`, `longname` as value FROM `anlaesse` WHERE status = 1 " ;
		if (req.query.filter != null) {
			var qfield = '%' + req.query.filter.value + '%';
			qrySelect = qrySelect + " AND lower(`longname`) like '" + qfield + "'";
		}
		qrySelect = qrySelect + " ORDER BY datum desc";
		
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
		.then((anlass) => anlass.destroy()
			.then((obj) => res.json({id: obj.id}))
			.catch((e) => console.error(e)))
		.catch((e) => console.log(e));
},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.Anlaesse.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		if (data.id == 0 || data.id == null) {
			// insert
			console.info('insert: anlass',data);
			db.Anlaesse.create(data)
				.then((obj) => res.json({ id: obj.id }))
				.catch((e) => console.error(e));
		} else {
			// update
			console.info('update: ',data);
		
			db.Anlaesse.findByPk(data.id)
			.then((anlass) => anlass.update(data)
				.then((obj) => res.json({id: obj.id}))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
		}
	},

};