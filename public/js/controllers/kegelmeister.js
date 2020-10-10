var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {	
		console.log("kegelmeister.js/getData");				
		db.Kegelmeister.findAll({
			where: {jahr: { [Op.gte]: (global.Parameter.get('CLUBJAHR') - 1 ) }},
			  order: [
			 	 ['rang', 'asc']
			 ]
		}).then(data => res.json(data));		
	},

	getOverviewData: async function (req, res) {
		var qrySelect = "SELECT 'Kegelmeisterschaft' as label, count(id) as value FROM kegelmeister"
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
		// berechnet den Kegelmeister für das Jahr req.query.jahr

		var arMeister = []
		var allMitgliedId = []
		var qrySelect = ""
		var data = []

		var qrySubSelect = "SELECT id FROM anlaesse where year(datum) = " + req.query.jahr + " AND istkegeln = 1"

		// Streichresultate ermitteln - nur im aktuellen Clubjahr
		if (req.query.jahr == global.Parameter.get('CLUBJAHR')) {
			qrySelect = "SELECT count(id) as value from anlaesse where status = 1 and datum > NOW() and YEAR(`datum`) = " + global.Parameter.get('CLUBJAHR');
			data = await sequelize.query(qrySelect, 
				{ 
					type: Sequelize.QueryTypes.SELECT,
					plain: true,
					logging: console.log,
					raw: true
				}
			);
			if (data.value == 0) {
				// Streichresultate setzen
				// Anzahl Ergebnisse = global.Parameter.get('ANZAHL_KEGEL')

				// alle Ergebnisse auf Streichresultat = 0
				qrySelect = "UPDATE meisterschaft set streichresultat = 0 where eventid in ( " + qrySubSelect + ")";
				await sequelize.query(qrySelect,
					{
						type: Sequelize.QueryTypes.UPDATE,
						plain: false,
						logging: console.log,
						raw: true
					}
				);					
			
				// alle Ergebnisse auf Streichresultat = 1, wenn Wurf-Total = 0
				qrySelect = "UPDATE meisterschaft set streichresultat = 1 where eventid in ( " + qrySubSelect + ")";
				qrySelect += " AND (wurf1 + wurf2 + wurf3 + wurf4 + wurf5) = 0"
				await sequelize.query(qrySelect,
					{
						type: Sequelize.QueryTypes.UPDATE,
						plain: false,
						logging: console.log,
						raw: true
					}
				);					
			
				// alle Ergebnisse, die weniger als 'Anzahl Ergebnisse' haben, Streichresultat = 1
				qrySelect = "SELECT mitgliedid, count(eventid) as anzahl FROM meisterschaft where eventid in ("
				qrySelect += qrySubSelect
				qrySelect += ") and streichresultat = 0 group by mitgliedid having anzahl < " + global.Parameter.get('ANZAHL_KEGEL')

				data = await sequelize.query(qrySelect, 
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
					}
					if (allMitgliedId.length > 0) {
						qrySelect = "UPDATE meisterschaft SET streichresultat = 1 WHERE eventid in (" + qrySubSelect + ")"
						qrySelect += " AND mitgliedid in (" + allMitgliedId.join(',') + ")"

						await sequelize.query(qrySelect,
							{
								type: Sequelize.QueryTypes.UPDATE,
								plain: false,
								logging: console.log,
								raw: true
							}
						);
						
						allMitgliedId = []
					}
				}
				
				// Update Ergebnisse, Rowid > ANZAHL_KEGELN => Streichresultat = 1
				qrySelect = "SELECT id, mitgliedid, (wurf1 + wurf2 + wurf3 + wurf4 + wurf5 + zusatz) as total FROM meisterschaft where eventid in ("
				qrySelect += qrySubSelect
				qrySelect += ") and streichresultat = 0 order by 2, 3 desc"

				data = await sequelize.query(qrySelect, 
					{ 
						type: Sequelize.QueryTypes.SELECT,
						plain: false,
						logging: console.log,
						raw: true
					}
				);
				if (data.length > 0) {
					var zwmitgliedid = 0
					var anzahl = 0
					iterator = data.entries();
					for(let mitglied of iterator) {
						if (zwmitgliedid != mitglied[1].mitgliedid) {
							zwmitgliedid = mitglied[1].mitgliedid
							anzahl = 0
						}
						anzahl++
						if (anzahl > global.Parameter.get('ANZAHL_KEGEL'))
							allMitgliedId.push(mitglied[1].id)
					}
					if (allMitgliedId.length > 0) {
						qrySelect = "UPDATE meisterschaft SET streichresultat = 1 WHERE id in (" + allMitgliedId.join(',') + ")"

						await sequelize.query(qrySelect,
							{
								type: Sequelize.QueryTypes.UPDATE,
								plain: false,
								logging: console.log,
								raw: true
							}
						);
						
						allMitgliedId = []
					}
				}
			} // keine offenen Kegelevents mehr
		} // nur im aktuellen Jahr

		// alle punkte aus den Anlässen einlesen (ohne Nachkegeln)
		qrySelect = "SELECT mitgliedid, sum(wurf1 + wurf2 + wurf3 + wurf4 + wurf5 + zusatz) as punkte, count(eventid) as anzahl FROM meisterschaft where eventid in ("
		qrySelect += "SELECT id FROM anlaesse where year(datum) = " + req.query.jahr + " AND istkegeln = 1 and nachkegeln = 0"
		qrySelect += ") and streichresultat = 0 group by mitgliedid"

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
				allMitgliedId.push(mitglied[1].mitgliedid)
				meister = {jahr: req.query.jahr, mitgliedid: mitglied[1].mitgliedid, punkte: Number(mitglied[1].punkte), anlaesse: Number(mitglied[1].anzahl), babeli: 0}
				arMeister.push(meister);
			}
		}

		
		// alle punkte aus den Nachkegeln lesen
		qrySelect = "SELECT mitgliedid, sum(wurf1 + wurf2 + wurf3 + wurf4 + wurf5 + zusatz) as punkte FROM meisterschaft where eventid in ("
		qrySelect += "SELECT id FROM anlaesse where year(datum) = " + req.query.jahr + " AND istkegeln = 1 and nachkegeln = 1"
		qrySelect += ") and streichresultat = 0 group by mitgliedid"

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
				var ifound = arMeister.findIndex((element) => element.mitgliedid == mitglied[1].mitgliedid)
				if (ifound > -1) {
					meister = arMeister[ifound]
					meister.punkte += Number(mitglied[1].punkte)
					arMeister[ifound] = meister
				} else {
					allMitgliedId.push(mitglied[1].mitgliedid)
					meister = {jahr: req.query.jahr, mitgliedid: mitglied[1].mitgliedid, punkte: Number(mitglied[1].punkte), anlaesse: 0, babeli: 0}
					arMeister.push(meister);
				}
			}
		}

		// anzahl babeli ermitteln
		qrySelect = ""
		for (let index = 1; index < 6; index++) {
			if (index > 1)
				qrySelect += " UNION "
			qrySelect += " SELECT " + index + " as wurf,mitgliedid, count(id) as babeli FROM meisterschaft where eventid in (" + qrySubSelect
			qrySelect += ") and wurf" + index + " = 9 group by mitgliedid"
		}

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
				ifound = arMeister.findIndex((element) => element.mitgliedid == mitglied[1].mitgliedid)
				if (ifound > -1) {
					meister = arMeister[ifound]
					meister.babeli +=  Number (mitglied[1].babeli)
					arMeister[ifound] = meister				
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
						var meister = arMeister[ifound]
						meister.mnr = mitglied[1].mnr
						meister.vorname = mitglied[1].vorname
						meister.nachname = mitglied[1].name
						meister.mitglieddauer = mitglied[1].mitglieddauer
						arMeister[ifound] = meister
					} else {
						console.error('kegelmeister.js/calcMeister: Beim Abfüllen der Mitglieddaten ist ein Fehler aufgetreten');
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
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.babeli > e2.babeli)
				order = -1
			else if (e1.punkte == e2.punkte && e1.anlaesse == e2.anlaesse && e1.babeli == e2.babeli)
				order = 0
			else order = 1

			return order
		});

		// bestehende Daten löschen
		qrySelect = "DELETE FROM kegelmeister WHERE jahr = " + req.query.jahr;
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
			qrySelect = "INSERT INTO kegelmeister (jahr, rang, vorname, nachname, mitgliedid, punkte, anlaesse, babeli, status) VALUES "
			const cMinPunkte = arMeister[0].punkte * 0.4;
			var status = 1;
			for (meister of arMeister) {
				if (ind > 0) {
					qrySelect += ","
					status = meister.punkte >= cMinPunkte;
				}
				qrySelect += "(" + req.query.jahr + "," + (ind + 1) + ",'" + meister.vorname + "','" + meister.nachname + "'," + meister.mitgliedid
				qrySelect += "," + meister.punkte + "," + meister.anlaesse + "," + meister.babeli + "," + status + ")"			
			}
			await sequelize.query(qrySelect,
				{
					type: Sequelize.QueryTypes.INSERT,
					plain: false,
					logging: console.log,
					raw: true
				}
			);			
		}
		res.json(result);		
	},

};