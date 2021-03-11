var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const dbFunc = require("./budget");
const Account = db.Account;
const Journal = db.Journal;

module.exports = {
	getData: async function (req, res) {
		var arJournalIds = [];
		// var arJournalFrom = await Journal.findAll({
		// 	attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('from_account')), "fromId"]],
		// 	where: Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr)
		// 	}
		// ).catch((e) => console.error(e));

		var arfromAcc = await global.sequelize.query("SELECT DISTINCT from_account FROM journal WHERE year(date) = ?" , 
			{ 
				replacements: [req.query.jahr],
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		)		
		.catch((e) => console.error(e));
		
		for (let index = 0; index < arfromAcc.length; index++) {
			const element = arfromAcc[index];
			arJournalIds.push(element.from_account);
		}


		// var arJournalTo = await Journal.findAll({
		// 	attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('to_account')), "toId"]] ,
		// 	where: Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), req.query.jahr)
		// 	}
		// ).catch((e) => console.error(e));;
		arfromAcc = await global.sequelize.query("SELECT DISTINCT to_account FROM journal WHERE year(date) = ?", 
			{ 
				replacements: [req.query.jahr],
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).catch((e) => console.error(e));
		for (let index = 0; index < arfromAcc.length; index++) {
			const element = arfromAcc[index];
			arJournalIds.push(element.to_account);
		}

		var arAccount = [];

		if (req.query.all == 0) {
			arAccount = await Account.findAll(
				{where: {
					[Op.and]: [
						{"order": { [Op.gt]: 10 }},
						{"status" : 1},
						{"id": {[Op.in]: arJournalIds}}						
					]},
				order: [["level", "ASC"], ["order", "ASC"]]
				}).catch((e) => console.error(e));;
		} else {
			arAccount = await Account.findAll(
				{where: {"order": { [Op.gt]: 10 }} ,
				order: [["level", "ASC"], ["order", "ASC"]]
				}).catch((e) => console.error(e));;
		}
		res.json(arAccount);
	},

	getOneData: function (req, res) {
		db.Account.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getOneDataByOrder: function (req, res) {
		Account.count({where: {"order": req.query.order}})
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		Account.findAll({
			attributes: ["id", [Sequelize.fn('CONCAT',Sequelize.col("name"), ' ', Sequelize.col("order")), "value"]],
			where: [
					Sequelize.where(Sequelize.fn('LOWER', Sequelize.col("name")), {[Op.substring]: (req.query.filter != null ? req.query.filter.value : '')}),
					{"order": { [Op.ne]: "level" }},
					{"status" : 1}					
			],
			order: [["level", "ASC"], ["order", "ASC"]]
			})
			.then(function(data){
				var arReturn = [];
				for (let index = 0; index < data.length; index++) {
					const element = data[index];					
					arReturn.push({id : element.id, value: '<span class=\"small\">' + element.value + '</span>'});					
				}
				req.json(arReturn);
			})
			.catch((e) => console.error(e));;
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		Account.create(data)
			.then((obj) => res.json(obj))
			.catch((e) => res.json({type: "error", message: e}));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ',data);
	
		Account.findByPk(data.id)
		.then((account) => account.update(data)
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	getAccountSummary: async function (req, res) {
		var arBudget = await db.Budget.findAll({where:{'year': req.query.jahr}});

		var qrySelect = "Select ac.`id`, ac.`level`, ac.`order`, ac.`name`, sum(j.`amount`) as amount, 0 as budget, 0 as diff, ";
		qrySelect += "(CASE WHEN ac.`status`= 1 THEN '' ELSE 'inactive' END) as $css"
		qrySelect += " from account ac ";
		qrySelect += " left outer join journal j ";
		qrySelect += " on ac.id = j.from_account ";
		qrySelect += " and year(j.date) = " + req.query.jahr;
		qrySelect += " group by ac.`id`,  ac.`level`, ac.`order`, ac.`name` ";
		qrySelect += " order by ac.`level`, ac.`order`";

		Sequelize.query(qrySelect, 
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
			Sequelize.query(qrySelect, 
				{ 
					type: Sequelize.QueryTypes.SELECT,
					plain: false,
					logging: console.log,
					raw: false
				}
			).then(data2 => {
				for (let ind2 = 0; ind2 < data2.length; ind2++) {
					const acc2 = data2[ind2];
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
				}

				for (let ind2 = 0; ind2 < data.length; ind2++) {
					const acc = data[ind2];
					found = arBudget.findIndex(bud => bud.account == acc.id);
					if (found >= 0) {
						data[ind2].budget = eval(arBudget[found].amount * 1);
					}
					data[ind2].diff = data[ind2].budget - data[ind2].amount;
				}
				res.json(data);
			})
			.catch((e) => console.error(e));
		})
		.catch((e) => console.error(e));					
	},

};