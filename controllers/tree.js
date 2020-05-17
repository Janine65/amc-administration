var db = require("../db");

module.exports = {
	getAll : function(req, res){
		db.Adressen.findAll()
		.then(data => 
			Promise.all(data.map(user => {
				return user.getDocuments({
					attributes:["id", ["name", "value"]]
				}).then(docs => {
					return { id: "u_"+user.id, open:true, value: user.name, data: docs }
				});
			}))
		).
		then(data => res.json(data));
	},
	getLevel: function(req, res){
		if (!req.query.parent)
			return db.Adressen.findAll()
				.then(data => {
					res.json(data.map(adresse => {
						return {id: "u_"+adresse.id, webix_kids:true, name: adresse.name }
					}));
				});
		else
			return db.Document.findAll({ 
				where:{ id: req.query.parent.replace("u_","") }, attributes:["name"]
			}).then(data => res.json({ parent: req.query.parent, data }));
	}
};