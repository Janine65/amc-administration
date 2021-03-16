const { Kegelmeister, Anlaesse, Meisterschaft, Adressen } = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {
		console.log("kegelmeister.js/getData");
		Kegelmeister.findAll({
			where: { jahr: req.query.jahr },
			order: [
				['rang', 'asc']
			]
		}).then(data => res.json(data));
	},

	getOverviewData: async function (req, res) {
		var arResult = [{ label: 'Kegelmeisterschaft', value: 0 }]
		var anzahl = await Kegelmeister.count({
			where: [{ "jahr": global.Parameter.get('CLUBJAHR') },
			{ "status": true }]
		});
		arResult[0].value = anzahl;
		res.json(arResult);
	},

	calcMeister: async function (req, res) {
		// berechnet den Kegelmeister für das Jahr req.query.jahr

		var arMeister = []
		var allMitgliedId = []
		var data = []

		data = await Anlaesse.findAll({
			where: [Sequelize.where(Sequelize.fn('year', Sequelize.col("datum")), req.query.jahr),
			{ "istkegeln": true }]
		});
		var arAnlaesse = []
		for (let ind1 = 0; ind1 < data.length; ind1++) {
			arAnlaesse.push(data[ind1].id);
		}

		// Streichresultate ermitteln - nur im aktuellen Clubjahr
		if (req.query.jahr <= global.Parameter.get('CLUBJAHR')) {
			var anzahl = await Anlaesse.count({
				where: [Sequelize.where(Sequelize.fn('year', Sequelize.col("datum")), req.query.jahr),
				{ "nachkegeln": false },
				{ "istkegeln": true },
				{ "datum": { [Op.gt]: new Date() } }
				],
				raw: true
			});
			if (anzahl == 0) {
				// Streichresultate setzen
				// Anzahl Ergebnisse = global.Parameter.get('ANZAHL_KEGEL')

				// alle Ergebnisse auf Streichresultat = 0
				await Meisterschaft.update({ "streichresultat": false },
					{ where: { "eventid": { [Op.in]: arAnlaesse } } });

				// alle Ergebnisse auf Streichresultat = 1, wenn Wurf-Total = 0
				await Meisterschaft.update({ "streichresultat": true },
					{
						where: [{ "eventid": { [Op.in]: arAnlaesse } },
						{ "total_kegel": { [Op.lte]: 5 } }]
					});

				// alle Ergebnisse, die weniger als 'Anzahl Ergebnisse' haben, Streichresultat = 1
				data = await Meisterschaft.findAll({
					attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("eventid")), "anzahl"]],
					where: [{ "eventid": { [Op.in]: arAnlaesse } },
					{ "streichresultat": false }],
					group: ["mitgliedid"],
					having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.col("eventid")), { [Op.lt]: global.Parameter.get('ANZAHL_KEGEL') }),
					raw: true
				})
				for (let ind = 0; ind < data.length; ind++) {
					allMitgliedId.push(data[ind].mitgliedid)
				}
				if (allMitgliedId.length > 0) {
					await Meisterschaft.update({ "streichresultat": true },
						{
							where: [{ "eventid": { [Op.in]: arAnlaesse } },
							{ "mitgliedid": { [Op.in]: allMitgliedId } }]
						});
					allMitgliedId = []
				}

				// Update Ergebnisse, Rowid > ANZAHL_KEGELN => Streichresultat = 1
				data = await Meisterschaft.findAll({
					attributes: ["id", "mitgliedid", "total_kegel"],
					where: [{ "eventid": { [Op.in]: arAnlaesse } },
					{ "streichresultat": false }],
					order: ["mitgliedid", ["total_kegel", "DESC"]],
					raw: true
				})
				var zwmitgliedid = 0
				anzahl = 0
				for (let ind = 0; ind < data.length; ind++) {
					if (zwmitgliedid != data[ind].mitgliedid) {
						zwmitgliedid = data[ind].mitgliedid
						anzahl = 0
					}
					anzahl++
					if (anzahl > global.Parameter.get('ANZAHL_KEGEL'))
						allMitgliedId.push(data[ind].id)

				}
				if (allMitgliedId.length > 0) {
					await Meisterschaft.update({ "streichresultat": true },
						{
							where: [{ "eventid": { [Op.in]: arAnlaesse } },
							{ "mitgliedid": { [Op.in]: allMitgliedId } }]
						});
					allMitgliedId = []
				}
			} // keine offenen Kegelevents mehr
		} // nur im aktuellen Jahr

		// alle punkte aus den Anlässen einlesen
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('SUM', Sequelize.col("total_kegel")), "punkte"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false }],
			group: ["mitgliedid"],
			raw: true
		});
		for (let ind = 0; ind < data.length; ind++) {
			allMitgliedId.push(data[ind].mitgliedid)
			meister = { jahr: req.query.jahr, mitgliedid: data[ind].mitgliedid, punkte: eval(data[ind].punkte * 1), anlaesse: 0, babeli: 0 }
			arMeister.push(meister);
		}

		// Anzahl Anlässe ermitteln
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("eventid")), "anzahl"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false }],
			include: {
				model: Anlaesse, as: "linkedEvent", required: true,
				attributes: [],
				where: { "nachkegeln": false }
			},
			group: ["mitgliedid"],
			raw: true
		})

		for (let ind = 0; ind < data.length; ind++) {
			let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].mitgliedid)
			if (ifound > -1) {
				arMeister[ifound].anlaesse = eval(data[ind].anzahl * 1)
			}
		}

		// anzahl babeli ermitteln
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("id")), "anzahl"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false },
			{ "wurf1": 9 }],
			group: ["mitgliedid"],
			raw: true
		})
		for (let ind = 0; ind < data.length; ind++) {
			let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].mitgliedid)
			if (ifound > -1) {
				arMeister[ifound].babeli += eval(data[ind].anzahl * 1)
			}
		}
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("id")), "anzahl"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false },
			{ "wurf2": 9 }],
			group: ["mitgliedid"],
			raw: true
		})
		for (let ind = 0; ind < data.length; ind++) {
			let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].mitgliedid)
			if (ifound > -1) {
				arMeister[ifound].babeli += eval(data[ind].anzahl * 1)
			}
		}
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("id")), "anzahl"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false },
			{ "wurf3": 9 }],
			group: ["mitgliedid"],
			raw: true
		})
		for (let ind = 0; ind < data.length; ind++) {
			let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].mitgliedid)
			if (ifound > -1) {
				arMeister[ifound].babeli += eval(data[ind].anzahl * 1)
			}
		}
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("id")), "anzahl"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false },
			{ "wurf4": 9 }],
			group: ["mitgliedid"],
			raw: true
		})
		for (let ind = 0; ind < data.length; ind++) {
			let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].mitgliedid)
			if (ifound > -1) {
				arMeister[ifound].babeli += eval(data[ind].anzahl * 1)
			}
		}
		data = await Meisterschaft.findAll({
			attributes: ["mitgliedid", [Sequelize.fn('COUNT', Sequelize.col("id")), "anzahl"]],
			where: [{ "eventid": { [Op.in]: arAnlaesse } },
			{ "streichresultat": false },
			{ "wurf5": 9 }],
			group: ["mitgliedid"],
			raw: true
		})
		for (let ind = 0; ind < data.length; ind++) {
			let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].mitgliedid)
			if (ifound > -1) {
				arMeister[ifound].babeli += eval(data[ind].anzahl * 1)
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
				let ifound = arMeister.findIndex((element) => element.mitgliedid == data[ind].id)
				if (ifound > -1) {
					var meister = arMeister[ifound]
					meister.mnr = data[ind].mnr
					meister.vorname = data[ind].vorname
					meister.nachname = data[ind].name
					meister.mitglieddauer = eval(req.query.jahr - data[ind].mitglieddauer);
					arMeister[ifound] = meister
				} else {
					console.error('kegelmeister.js/calcMeister: Beim Abfüllen der Mitglieddaten ist ein Fehler aufgetreten');
				}

			}
		}
		// nun wird der Array sortiert nach den entsprechenden Kriterien
		arMeister.sort((e1, e2) => {
			var order = 0
			if (e1.punkte > e2.punkte)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse > e2.anlaesse)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.babeli > e2.babeli)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.babeli == e2.babeli)
				order = 0
			else order = 1

			return order
		});

		// bestehende Daten löschen
		await Kegelmeister.destroy({
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
			await Kegelmeister.bulkCreate(arMeister,
				{
					fields: ["jahr",
						"rang",
						"vorname",
						"nachname",
						"mitgliedid",
						"punkte",
						"anlaesse",
						"babeli",
						"status"]
				})
		}
		res.json({ ok: true });
	},

};