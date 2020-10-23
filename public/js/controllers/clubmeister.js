var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: async function (req, res) {	
		console.log("clubmeister.js/getData");	
		await db.Clubmeister.findAll({
			where: {jahr: { [Op.gte]: (global.Parameter.get('CLUBJAHR') - 1 ) }},
			  order: [
			 	 ['rang', 'asc']
			 ]
		}).then(data => res.json(data));		
	},

	getOverviewData: async function (req, res) {
		var qrySelect = "SELECT 'Clubmeisterschaft' as label, count(id) as value FROM clubmeister"
		qrySelect += " WHERE jahr = " + global.Parameter.get('CLUBJAHR') + " and status = 1"
		await sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: false
			}
		).then(data => res.json(data));					
	},

	calcMeister: async function (req, res) {
		// berechnet den Clubmeister für das Jahr req.query.jahr

		var arMeister = []
		var allMitgliedId = []

		// alle punkte aus den Anlässen einlesen
		var qrySelect = "SELECT mitgliedid, sum(punkte) as punkte, count(eventid) as anzahl FROM meisterschaft where eventid in ("
		qrySelect += "SELECT id FROM anlaesse where year(datum) = " + req.query.jahr
		qrySelect += ") and punkte > 0 group by mitgliedid"

		var data = await sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: true
			}
		);
		if (data.length > 0) {
			var iterator = data.entries();
			for(let mitglied of iterator) {
				allMitgliedId.push(mitglied[1].mitgliedid)
				var meister = {jahr: req.query.jahr, mitgliedid: mitglied[1].mitgliedid, punkte: Number(mitglied[1].punkte), anlaesse: Number(mitglied[1].anzahl), werbungen: 0, mitglieddauer: 0}
				arMeister.push(meister);
			}
		}

		
		// Mitgliedwerbung lesen
		qrySelect = "SELECT a.id, count(b.id) as anzahl FROM adressen a JOIN adressen b ON a.id = b.adressenid"
		qrySelect += " WHERE YEAR(b.eintritt) = " + req.query.jahr
		qrySelect += " and year(b.austritt) > year(sysdate())"
		qrySelect += " GROUP BY a.id"

		data = await sequelize.query(qrySelect, 
			{ 
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: true
			}
		);
		
		if (data.length > 0) {
			iterator = data.entries();
			for(let mitglied of iterator) {
				let lPunkte = mitglied[1].anzahl * 50
				var ifound = arMeister.findIndex((element) => element.mitgliedid == mitglied[1].mitgliedid)
				if (ifound > -1) {
					meister = arMeister[ifound]
					meister.werbungen = Number(mitglied[1].anzahl)
					meister.punkte = mitglied[1].punkte + lPunkte
					arMeister[ifound] = meister
				} else {
					allMitgliedId.push(mitglied[1].mitgliedid)
					meister = {jahr: req.query.jahr, mitgliedid: mitglied[1].mitgliedid, punkte: Number(mitglied[1].punkte), anlaesse: 0, werbungen: Number(mitglied[1].anzahl), mitglieddauer: 0}
					arMeister.push(meister);
				}
			}
		}

		if (allMitgliedId.length > 0) {
			// Informationen aus Adresse lesen
			qrySelect = "SELECT id, mnr, vorname, name, (" + req.query.jahr + " - year(eintritt)) as mitglieddauer FROM adressen"
			qrySelect += " WHERE id in (" + allMitgliedId.join(',') + ")" 
				
			data = await sequelize.query(qrySelect, 
				{ 
					type: Sequelize.QueryTypes.SELECT,
					plain: false,
					logging: console.log,
					raw: true
				}
			);
			if (data.length > 0) {
				iterator = data.entries();
				for(let mitglied of iterator) {
						ifound = arMeister.findIndex((element) => element.mitgliedid == mitglied[1].id)
					if (ifound > -1) {
						meister = arMeister[ifound]
						meister.mnr = mitglied[1].mnr
						meister.vorname = mitglied[1].vorname
						meister.nachname = mitglied[1].name
						meister.mitglieddauer = Number(mitglied[1].mitglieddauer)
						arMeister[ifound] = meister
					} else {
						console.error('clubmeister.js/calcMeister: Beim Abfüllen der Mitglieddaten ist ein Fehler aufgetreten');
					}
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
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.mitglieddauer > e2.mitglieddauer)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.mitglieddauer == e2.mitglieddauer)
				order = 0
			else order = 1

			return order
		});

		// bestehende Daten löschen
		qrySelect = "DELETE FROM clubmeister WHERE jahr = " + req.query.jahr;
		await sequelize.query(qrySelect,
			{
				type: Sequelize.QueryTypes.DELETE,
				plain: false,
				logging: console.log,
				raw: true
			}
		);					

		// insert und Rang setzten
		if (arMeister.length > 0) {
			qrySelect = "INSERT INTO clubmeister (jahr, rang, vorname, nachname, mitgliedid, punkte, anlaesse, werbungen, mitglieddauer, status) VALUES "
			const cMinPunkte = arMeister[0].punkte * 0.4;
			var status = 1;
			arMeister.forEach((meister2, ind) => {
				if (ind > 0) {
					qrySelect += ","
					status = meister2.punkte >= cMinPunkte;
				}
				qrySelect += "(" + req.query.jahr + "," + (ind + 1) + ",'" + meister2.vorname + "','" + meister2.nachname + "'," + meister2.mitgliedid
				qrySelect += "," + meister2.punkte + "," + meister2.anlaesse + "," + meister2.werbungen + "," + meister2.mitglieddauer + "," + status + ")"			
			});
			await sequelize.query(qrySelect,
				{
					type: Sequelize.QueryTypes.INSERT,
					plain: false,
					logging: console.log,
					raw: true
				}
			);			
		}
		res.json({ok: true});		
	},

};