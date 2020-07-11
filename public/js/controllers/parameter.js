var db = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		db.Parameter.findAll()
		.then(data => res.json(data))
		.catch((e) => console.error(e));		
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ',data);
		db.Parameter.findByPk(data.id)
		.then((param) =>
			param.destroy()
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		var data = req.body;
		console.info('insert: ',data);
		db.Parameter.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		var data = req.body;
		if (data.id == 0 || data.id == null) {
			// insert
			console.info('insert: ',data);
			db.Parameter.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e))
		} else {
			// update
			console.info('update: ',data);
		
			db.Parameter.findByPk(data.id)
			.then((param) => param.update(data)
				.then((obj) => res.json({id: obj.id}))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
		}
	},

};

global.Parameter = new Map();
db.Parameter.findAll()
.then(function(lparam){
	lparam.forEach(param => {
		global.Parameter.set(param.key, param.value);	
	});
})
.catch((e) => console.error(e));

