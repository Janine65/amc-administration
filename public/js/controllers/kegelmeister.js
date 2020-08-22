var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {	
		console.log("kegelmeister.js/getData");				
		db.Kegelmeister.findAll({
			where: {jahr: { [Op.gte]: (global.Parameter.get('CLUBJAHR') - 1 ) }},
			  order: [
			 	 ['punkte', 'desc']
			 ]
		}).then(data => res.json(data));		
	},


};