var formidable = require('formidable');
var db = require('../db');

module.exports = {
	getData: function(req, res){
		db.Anrede.findByPk(req.params.recordId).then(data => res.json(data));
	},
	saveData: function(req, res){
		db.Adressen.findByPk(req.body.id)
			.then((adresse) => 
				adresse.update({
					name: 		req.body.name,
					email: 		req.body.email,
					anrede:	req.body.anrede
				}))
			.then(() => 
				res.json({}));
	},
	getOptions: function(req, res){
		db.Anrede.findAll({ attributes: ["id", "anrede"] }).then((data) => res.json(data));
	},

	doUpload : function(req, res){
		var form = new formidable.IncomingForm();

		form.parse(req, function(err, fields, files) {
			//in a real app you will move file to the persistent storage here
			//as this is a demo, we will skip file in the temp folder
			
			//store info about file in DB and return file id to client
			db.File.create({ 
				name: files.upload.name,
				path: files.upload.path
			}).then(saved => res.json({ value: saved.id }));
		});
	}
};