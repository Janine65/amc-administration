var { Meisterschaft, Adressen, Anlaesse } = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {

		Meisterschaft.findAll({
			where: { eventid: { [Op.eq]: req.query.eventid } },
			include: [
				{ model: Adressen, as: 'teilnehmer', required: true, attributes: ['id', 'fullname'] }
			],
			order: [
				['teilnehmer', 'fullname', 'asc']
			]
		}).then(data => res.json(data));
	},

	getOneData: function (req, res) {
		Meisterschaft.findOne({
			where: { id: { [Op.eq]: req.query.id } },
			include: [
				{ model: Adressen, as: 'teilnehmer', required: true, attributes: ['id', 'fullname'] }
			]
		}).then(data => res.json(data));
	},

	getMitgliedData: function (req, res) {
		Meisterschaft.findAll({
			attributes: ["punkte", ["total_kegel", "total_kegeln"], "streichresultat"],
			where: { "mitgliedid": req.query.id },
			include: {
				model: Anlaesse, as: "linkedEvent",
				where: Sequelize.where(Sequelize.fn('year', Sequelize.col("datum")), { [Op.lte]: global.Parameter.get("CLUBJAHR") }),
				attributes: [[Sequelize.fn('year', Sequelize.col("datum")), "jahr"], "datum", "name"],
			},
			order: [["linkedEvent","datum","DESC"]],
			raw: true, nest: true
		})
			.then(data => {
				// console.log(data);
				for (let ind = 0; ind < data.length; ind++) {
					data[ind].jahr = data[ind].linkedEvent.jahr;
					data[ind].datum = data[ind].linkedEvent.datum;
					data[ind].name = data[ind].linkedEvent.name;
				}
				// console.log(data);
				res.json(data)
			})
			.catch(error => console.error(error));

	},

	getChartData: function (req, res) {

		Anlaesse.findAll({
			attributes: ["datum", "name", "gaeste", "anlaesseid"],
			where: [{"nachkegeln": false},
				Sequelize.where(Sequelize.fn('YEAR', Sequelize.col("datum")), req.query.jahr)],
			include: {model: Meisterschaft, 
				attributes: [[Sequelize.fn('COUNT', Sequelize.col("mitgliedid")), "teilnehmer"]]},
		group: ["datum", "name", "gaeste", "anlaesseid"],
		raw: true, nest: true
		})
		.then(data => {
			// console.log(data);   
			var arAnlaesse = [];
			for (let index = 0; index < data.length; index++) {
				arAnlaesse.push(data[index].anlaesseid);
			}
			if (req.query.vorjahr == 'true') {
				Anlaesse.findAll({
					attributes: ["gaeste"],
					where: {"id": {[Op.in]: arAnlaesse}},
					include: 
						{model: Meisterschaft, 
							attributes: ["eventid", [Sequelize.fn('COUNT', Sequelize.col("mitgliedid")), "teilnehmer"]]},
					group: ["eventid","gaeste"],
					raw: true, nest: true
				})
				.then(data2 => {
					for (let index = 0; index < data.length; index++) {
						data[index].aktjahr = Number(data[index].meisterschafts.teilnehmer) + Number(data[index].gaeste);
						let ind = data2.findIndex((element) => element.meisterschafts.eventid == data[index].anlaesseid);
						if (ind >= 0) {
							data[index].vorjahr = Number(data2[ind].meisterschafts.teilnehmer) + Number(data2[ind].gaeste);
						} else {
							data[index].vorjahr = 0;
						}
						
					}
					res.json(data);
				})
				.catch(err2 => console.error(err2));
			} else {
				res.json(data);
			}
		})
		.catch(err => console.error(err));


	},

	checkJahr: function (req, res) {
		Meisterschaft.count({
			where: {"streichresultat": true},
			include: {model: Anlaesse, as: "linkedEvent", 
				attributes: [],
				where: Sequelize.where(Sequelize.fn('YEAR', Sequelize.col("datum")), req.query.jahr)}
		})
		.then(data => res.json({AnzStreich: data}))
		.catch(err => console.error(err));
	},

	removeData: function (req, res) {
		const data = req.body;
		if (data == undefined) {
			throw "Record not correct";
		}
		console.info('delete: ', data);
		Meisterschaft.findByPk(data.id)
			.then((eintrag) => eintrag.destroy()
				.then((obj) => res.json({ id: obj.id }))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ', data);
		Meisterschaft.create(data)
			.then((obj) => res.json(obj.id))
			.catch((e) => console.error(e));
	},

	updateData: function (req, res) {
		var data = req.body;
		// update
		console.info('update: ', data);

		Meisterschaft.findByPk(data.id)
			.then((eintrag) => eintrag.update(data)
				.then((obj) => res.json(obj))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

};