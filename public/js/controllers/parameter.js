const { Parameter } = require("../db");
const { Op, Sequelize } = require("sequelize");

module.exports = {
	getData: function (req, res) {		
		Parameter.findAll()
		.then(data => {
			console.log(data);
			let param = new Parameter({key: "Version", value: global.system.version});
			data.push(param);			
			return res.json(data);
		})
		.catch((e) => console.error(e));		
	},

	getGlobal: function () {		
		Parameter.findAll()
		.then(data => {
			global.Parameter.set("Version", global.system.version);
			for (let ind2 = 0; ind2 < data.length; ind2++) {
				const param = data[ind2];
				global.Parameter.set(param.key, param.value);	
			}
			
			return true;
		})
		.catch((e) => console.error(e));		
	},

	getOneDataByKey: function(req, res) {
		const data = req.body;
		Parameter.findOne({where: 
				{ key: {[Op.eq]: data.key } }
		})
		.then(data2 => res.json(data2))
		.catch((e) => console.error(e));
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ',data);
		Parameter.findByPk(data.id)
		.then((param) =>
			param.destroy()
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e)))
		.catch((e) => console.error(e));
	},

	addData: function (req, res) {
		let data = req.body;
		data.id = null;
		console.info('insert: ',data);
		Parameter.create(data)
			.then((obj) => res.json({ id: obj.id }))
			.catch((e) => console.error(e));
	},
	
	updateData: function (req, res) {
		let lparam = req.body;
		let ok = true;
		if (lparam) {
			for (let k of Object.keys(lparam)) {
				// update
				console.info('update: ',k, lparam[k]);
			
				Parameter.findOne({where: 
					{ key: {[Op.eq]: k } }
				})	
				.then((param) => param.update({value: lparam[k]})
					.then((updated) => global.Parameter.set(updated.key, updated.value))
					.catch((e) => {ok = false; console.error(e);}))
				.catch((e) => {ok = false; console.error(e);});
			}
			if (ok) {
				res.json({});
			}
		}
	},

};
