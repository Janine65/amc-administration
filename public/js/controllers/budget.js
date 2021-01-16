var db = require("../db");
const { Op, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require('uuid');
const { Budget, Account } = require("../db")

module.exports = {
	getData: function (req, res) {
		var qrySelect = "SELECT account.id, account.name, account.level, account.order, acc.id AS accid, acc.memo AS accmemo, acc.amount AS accamount,";
		qrySelect += "(CASE WHEN account.`status`= 1 THEN '' ELSE 'inactive' END) as $css"
		qrySelect += " FROM account AS account LEFT OUTER JOIN budget AS acc ON account.id = acc.account AND acc.year = " + req.query.jahr;
		qrySelect += " WHERE account.level IN ('4','6') AND account.order > account.level";
		qrySelect += " ORDER BY account.order ASC";

		sequelize.query(qrySelect,
			{
				type: Sequelize.QueryTypes.SELECT,
				plain: false,
				logging: console.log,
				raw: true
			}
		)
		.then(data => {

			res.json(data);
		})
		.catch((e) => console.error(e));
	},

	getOneData: function (req, res) {
		Budget.findByPk(req.param.id)
			.then(data => res.json(data))
			.catch((e) => console.error(e));
	},

	removeData: function (req, res) {
		const data = req.body;
		console.info('delete: ', data);
		Budget.findByPk(data.id)
			.then((budget) =>
				budget.destroy()
					.then((obj) => res.json({ id: obj.id }))
					.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},

	addData: async function (req, res) {
		var data = req.body;
		console.info('insert: ', data);

		Budget.create(data)
			.then((obj) => res.json(obj))
			.catch((e) => console.error(e));
			
	},

	updateData: function (req, res) {
		var data = req.body;
		console.info('update: ', data);

		Budget.findByPk(data.id)
			.then((budget) => budget.update(data)
				.then((obj) => res.json(obj))
				.catch((e) => console.error(e)))
			.catch((e) => console.error(e));
	},


};