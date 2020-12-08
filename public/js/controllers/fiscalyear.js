var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const {FiscalYear, Journal} = require("../db");

module.exports = {
	getData: function (req, res) {		
		FiscalYear.findAll({order: [['year', 'asc']]})
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	getOneData: function (req, res) {
		FiscalYear.findOne({ where: { 			
			year: req.query.jahr }
			})
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		var qrySelect = "SELECT `year` as id, ";
		qrySelect += " CONCAT(`name`,' - ', (CASE WHEN `state`= 1 THEN 'offen' WHEN `state`= 2 THEN 'prov. abgeschlossen' ELSE 'abgeschlossen' END)) as value,"; 
		qrySelect += "(CASE WHEN `state`= 1 THEN 'open' WHEN `state`= 2 THEN 'prov-closed' ELSE 'closed' END) as $css"
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
		FiscalYear.findByPk(data.id)
		.then((fiscalyear) =>
			fiscalyear.update({status: 0})
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		FiscalYear.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ',data);
	
		FiscalYear.findByPk(data.id)
		.then((fiscalyear) => fiscalyear.update(data)
			.then((obj) => res.json({id: obj.id}))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	closeYear: async function (req, res) {
		var sJahr = req.query.jahr;
		var sNextJahr = parseInt(sJahr) + 1;
		var iStatus = req.query.status;
		/**
		 * Ein Geschäftsjahr wird geschlossen (provisorisch oder definitiv)
		 * 1. Neues Fiscalyear eröffnen - sofern nicht schon eröffnet
		 * 2. Gewinn / Verlust berechnen
		 * 3. Eröffnungsbuchungen erfassen
		 * 4. im Journal die Nummerierung vornehmen
		 * 5. Status vom alten Fiscalyear setzen
		 */

		// Journal - Bilanz Summen lesen
		// Aktive
		var qrySelect = "SELECT j.from_account as account, SUM(j.amount) AS amount";
		qrySelect += " FROM journal j WHERE YEAR(j.date) = " + sJahr;
		qrySelect += " and j.from_account in (select id from account where level = 1)";
		qrySelect += " GROUP BY j.from_account";
		var arAktiv = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => console.error(e));

		qrySelect = "SELECT j.to_account as account, SUM(j.amount) AS amount";
		qrySelect += " FROM journal j WHERE YEAR(j.date) = " + sJahr;
		qrySelect += " and j.to_account in (select id from account where level = 1)";
		qrySelect += " GROUP BY j.to_account";
		var arAktiv2 = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => console.error(e));
		arAktiv2.forEach( record => {
			var found = arAktiv.findIndex(acc => acc.account == record.account);
			if (found > -1) {
				arAktiv[found].amount = arAktiv[found].amount - record.amount;
			} else {
				arAktiv.push(record);
			}
		})

		// Passive
		qrySelect = "SELECT j.from_account as account, SUM(j.amount) AS amount";
		qrySelect += " FROM journal j WHERE YEAR(j.date) = " + sJahr;
		qrySelect += " and j.from_account in (select id from account where level = 2)";
		qrySelect += " GROUP BY j.from_account";
		var arPassiv = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => console.error(e));

		qrySelect = "SELECT j.to_account as account, SUM(j.amount) AS amount";
		qrySelect += " FROM journal j WHERE YEAR(j.date) = " + sJahr;
		qrySelect += " and j.to_account in (select id from account where level = 2)";
		qrySelect += " GROUP BY j.to_account";
		var arPassiv2 = await sequelize.query(qrySelect,
            {
                type: Sequelize.QueryTypes.SELECT,
                plain: false,
                logging: console.log,
                raw: false
            }
        ).catch((e) => console.error(e));
		arPassiv2.forEach( record => {
			var found = arPassiv.findIndex(acc => acc.account == record.account);
			if (found > -1) {
				arPassiv[found].amount = record.amount - arPassiv[found].amount;
			} else {
				arPassiv.push(record);
			}
		})

		var arEroeffnung = [];
		var iGewinn = 0.0;

		arAktiv.forEach (entry => {
			if (entry.account != 39)
				arEroeffnung.push({date: new Date('01.01.' + sNextJahr), from_account: entry.account, to_account: 39, amount: entry.amount, memo: "Kontoeröffnung (Saldovortrag)"})
			iGewinn += parseFloat(entry.amount);
		})
		arPassiv.forEach (entry => {
			if (entry.account != 39)
				arEroeffnung.push({date: new Date('01.01.' + sNextJahr), from_account: 39, to_account: entry.account, amount: entry.amount, memo: "Kontoeröffnung (Saldovortrag)"})
			iGewinn -= parseFloat(entry.amount);
		})

		 // Fiscalyear erfassen
		var newFiscalyear = await FiscalYear.findOne(
			{ where: { year: sNextJahr} })
			.catch((e) => console.error(e));
		if (!newFiscalyear) {
			// neues Buchhaltungsjahr erstellen
			newFiscalyear = {year: sNextJahr, name: "AMC-Buchhaltung " + sNextJahr, state: 1};
			
			await FiscalYear.create(newFiscalyear)
				.then((obj) => newFiscalyear.id = obj.id)
				.catch(err => console.error(err));
			
		} else {
			// lösche alle Eröffnungsbuchungen
			qrySelect = "DELETE FROM journal where year(date) = " + sNextJahr;
			qrySelect += " and (from_account = 39 or to_account = 39)";
			await sequelize.query(qrySelect,
				{
					type: Sequelize.QueryTypes.DELETE,
					plain: false,
					logging: console.log,
					raw: false
				}
			).catch((e) => console.error(e));	
		}

		// Eröffnungsbuchungen erstellen
		await Journal.bulkCreate(arEroeffnung)
		.catch(err => console.error(err));

		// Status vom Buchungsjahr ändern
		qrySelect = "UPDATE fiscalyear set state = " + iStatus;
		qrySelect += " WHERE year = " + sJahr;
		await sequelize.query(qrySelect,
			{
				type: Sequelize.QueryTypes.UPDATE,
				plain: false,
				logging: console.log,
				raw: false
			}
		).catch((e) => console.error(e));	

		// Buchungsnummern setzten
		
	},
};