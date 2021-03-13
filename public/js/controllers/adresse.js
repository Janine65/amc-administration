const { Adressen } = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		Adressen.findAll({ where: { 			
			austritt: { [Op.gte]: new Date() }
			 }})
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	getOverviewData: async function (req, res) {
		// get a json file with the following information to display on first page:
		// count of active adressen
		// count of SAM_Mitglieder
		// count of not SAM_Mitglieder
		
		var arResult = [{label: 'Aktive Mitglieder', anzahl: 0},{label: 'SAM Mitglieder', anzahl: 0},{label: 'Freimitglieder', anzahl: 0}];

		var anzahl = await Adressen.count({
			where: {"austritt": { [Op.gt]: Sequelize.fn('NOW') } }
		});
		arResult[0].anzahl = anzahl;

		anzahl = await Adressen.count({
			where: [{"austritt": { [Op.gt]: Sequelize.fn('NOW') } }, 
				{"sam_mitglied": true}]
		});
		arResult[1].anzahl = anzahl;

		anzahl = await Adressen.count({
			where: [{"austritt": {[Op.gt]: Sequelize.fn('NOW')}}, 
			{"sam_mitglied": false}]
		});
		arResult[2].anzahl = anzahl;

		res.json(arResult);
	},

	getOneData: function (req, res) {
		Adressen.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	getFKData: function(req, res) {
		Adressen.findAll({ 
			attributes: ["id", ["fullname", "value"]],
			where: [
				{"austritt": { [Op.gte]: new Date() } },
				Sequelize.where(Sequelize.fn('LOWER', Sequelize.col("fullname")), {[Op.substring]: (req.query.filter != null ? req.query.filter.value : '')})],
			order: ["fullname"]
			 })
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ',data);
		let endDate = new Date();
		endDate.setMonth(11);
		endDate.setDate(31);
		Adressen.findByPk(data.id)
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
		Adressen.create(data)
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
			Adressen.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e))
		} else {
			// update
			console.info('update: ',data);
		
			Adressen.findByPk(data.id)
			.then((adresse) => adresse.update(data)
				.then((obj) => res.json({id: obj.id}))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
		}
	},

};