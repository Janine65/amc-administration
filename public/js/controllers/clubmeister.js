const { Clubmeister, Meisterschaft, Adressen, Anlaesse } = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: async function (req, res) {	
		console.log("clubmeister.js/getData");	
		await Clubmeister.findAll({
			where: {jahr: req.query.jahr},
			  order: [
			 	 ['rang', 'asc']
			 ]
		}).then(data => res.json(data));		
	},

	getOverviewData: async function (req, res) {
		let arResult = [{label: 'Clubmeisterschaft', value: 0}]
		let anzahl = await Clubmeister.count({
			where: [{"jahr" : global.Parameter.get('CLUBJAHR')},
			{"status" : true}]
		});
		arResult[0].value = anzahl;
		res.json(arResult);
	},

	calcMeister: async function (req, res) {
		// berechnet den Clubmeister für das Jahr req.query.jahr

		let arMeister = []
		let allMitgliedId = []

		let data = await Anlaesse.findAll({
			where: Sequelize.where(Sequelize.fn('year', Sequelize.col("datum")), req.query.jahr)
		});
		let arAnlaesse = []
		for (let ind = 0; ind < data.length; ind++) {
			arAnlaesse.push(data[ind].id);
		}

		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('SUM', Sequelize.col("punkte")), "punkte"], [Sequelize.fn("COUNT", Sequelize.col("eventid")), "anzahl"]],
			where: [{"eventid": {[Op.in]: arAnlaesse}},
					{"punkte": {[Op.gt]: 0}}],
			group: ["mitgliedid"],
			raw: true
		})

		for (let ind = 0; ind < data.length; ind++) {
			allMitgliedId.push(data[ind].mitgliedid)
			let meister = {jahr: req.query.jahr, mitgliedid: data[ind].mitgliedid, punkte: Number(data[ind].punkte), anlaesse: Number(data[ind].anzahl), werbungen: 0, mitglieddauer: 0}
			arMeister.push(meister);
		}

		data = await Adressen.findAll({
			attributes: ["adressenid", [Sequelize.fn('COUNT', Sequelize.col("id")), "anzahl"]],
			where: [Sequelize.where(Sequelize.fn('year', Sequelize.col("eintritt")), req.query.jahr),
				{"austritt": "3000-01-01T00:00:00"}],
			group: "adressenid"
		})
		
		for (let ind = 0; ind < data.length; ind++) {
			let lPunkte = data[ind].anzahl * 50
				let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].adressenid)
				if (ifound > -1) {
					meister = arMeister[ifound]
					meister.werbungen = Number(data[ind].anzahl)
					meister.punkte = meister.punkte + lPunkte
					arMeister[ifound] = meister
				}
		}

		if (allMitgliedId.length > 0) {
			// Informationen aus Adresse lesen
			data = await Adressen.findAll({
				attributes: ["id", "mnr", "vorname", "name", [Sequelize.fn('YEAR', Sequelize.col("eintritt")), "mitglieddauer"]],
				where: { "id": { [Op.in]: allMitgliedId } },
				raw: true
			})

			for (let ind = 0; ind < data.length; ind++) {
				ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].id)
				if (ifound > -1) {
					meister = arMeister[ifound]
					meister.mnr = data[ind].mnr
					meister.vorname = data[ind].vorname
					meister.nachname = data[ind].name
					meister.mitglieddauer = eval(req.query.jahr - data[ind].mitglieddauer);
					arMeister[ifound] = meister
				} else {
					console.error('clubmeister.js/calcMeister: Beim Abfüllen der Mitglieddaten ist ein Fehler aufgetreten');
				}

			}
		}

		// nun wird der Array sortiert nach den entsprechenden Kriterien
		arMeister.sort((e1, e2) => {
			let order = 0
			if (e1.punkte > e2.punkte)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse > e2.anlaesse)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.mitglieddauer > e2.mitglieddauer)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.mitglieddauer == e2.mitglieddauer)
				order = 0
			else order = 1

			return order
		});

		// bestehende Daten löschen
		await Clubmeister.destroy({
			where: { "jahr": req.query.jahr }
		})

		// insert und Rang setzten
		if (arMeister.length > 0) {
			const cMinPunkte = arMeister[0].punkte * 0.4;
			for (let ind = 0; ind < arMeister.length; ind++) {
				arMeister[ind].rang = ind + 1
				arMeister[ind].status = arMeister[ind].punkte >= cMinPunkte;
			}
			console.log(arMeister);
			await Clubmeister.bulkCreate(arMeister,
				{
					fields: ["jahr",
						"rang",
						"vorname",
						"nachname",
						"mitgliedid",
						"punkte",
						"anlaesse",
						"werbungen",
						"mitglieddauer",
						"status"]
				});
		}
		res.json({ok: true});		
	},

};