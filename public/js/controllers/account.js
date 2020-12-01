var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		db.Account.findAll({order: [['level', 'asc'],['order', 'asc']]})
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	getOneData: function (req, res) {
		db.Account.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `id`, CONCAT(`order`,' ',`name`) as value";
		qrySelect += " FROM `account` WHERE `status` = 1 and `level` != `order` " ;
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
		db.Account.findByPk(data.id)
		.then((account) =>
			account.update({status: 0})
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.Account.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ',data);
	
		db.Account.findByPk(data.id)
		.then((account) => account.update(data)
			.then((obj) => res.json({id: obj.id}))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	getAccountSummary: function (req, res) {
		var qrySelect = "Select ac.`id`, ac.`level`, ac.`order`, ac.`name`, sum(j.`amount`) as amount ";
		qrySelect += " from account ac ";
		qrySelect += " left outer join journal j ";
		qrySelect += " on ac.id = j.from_account ";
		qrySelect += " and year(j.date) = " + req.query.jahr;
		qrySelect += " group by ac.`id`,  ac.`level`, ac.`order`, ac.`name` ";
		qrySelect += " order by ac.`level`, ac.`order`";

		sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).then(data => {
			qrySelect = "Select ac.`id`, ac.`level`, ac.`order`, ac.`name`, sum(j.`amount`) as amount ";
			qrySelect += " from account ac ";
			qrySelect += " join journal j ";
			qrySelect += " on ac.id = j.to_account ";
			qrySelect += " and year(j.date) = " + req.query.jahr;
			qrySelect += " group by ac.`id`,  ac.`level`, ac.`order`, ac.`name` ";
			qrySelect += " order by ac.`level`, ac.`order`";
			sequelize.query(qrySelect, 
				{ 
					type: Sequelize.QueryTypes.SELECT,
					plain: false,
					logging: console.log,
					raw: false
				}
			).then(data2 => {
				data2.forEach( acc2 => {
					var found = data.findIndex(acc => acc.id == acc2.id);
					switch (data[found].level) {
						case 1:
						case 4:
							data[found].amount = eval(data[found].amount - acc2.amount);
							break;
						case 2:
						case 6:
							data[found].amount = eval(acc2.amount - data[found].amount);
							break;
					}				
				})
				res.json(data);
			})
			.catch((e) => console.error(e));
		})
		.catch((e) => console.error(e));					
	},

};