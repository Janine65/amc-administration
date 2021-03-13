const { Anlaesse } = require("../db");
const { Op,
  Sequelize
} = require("sequelize");


module.exports = {
  getData: function (req, res) {
    Anlaesse.findAll({
      where: Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('datum')), { [Op.gte]: global.Parameter.get("CLUBJAHR") - 1 }),
      include: [
        { model: Anlaesse, as: 'linkedEvent', required: false, attributes: [["longname", "vorjahr"]] }],
      order: ["datum"]
    })
      .then((data) => res.json(data));
  },

  getOverviewData: async function (req, res) {
    // get a json file with the following information to display on first page:
    // count of anlaesse im system_param jahr
    // count of SAM_Mitglieder
    // count of not SAM_Mitglieder

    var arResult = [{ label: 'Total Anlässe', value: 0 }, { label: 'Zukünftige Anlässe', value: 0 }]
    var total = await Anlaesse.count({
      where: [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('datum')), global.Parameter.get("CLUBJAHR")),
      { "status": 1 },
      { "istsamanlass": false },
      { "nachkegeln": false }]
    });
    arResult[0].anzahl = total;
    total = await Anlaesse.count({
      where: [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('datum')), global.Parameter.get("CLUBJAHR")),
      { "datum": { [Op.gte]: Sequelize.fn("NOW") } },
      { "status": 1 },
      { "istsamanlass": false },
      { "nachkegeln": false }]
    });
    arResult[1].anzahl = total;

    res.json(arResult);
  },

  getOneData: function (req, res) {
    Anlaesse.findByPk(req.param.id).then((data) => res.json(data));
  },

  getFKData: function (req, res) {
    var qrySelect =
      "SELECT `id`, `longname` as value FROM `anlaesse` WHERE status = 1 ";
    if (req.query.filter != null) {
      var qfield = "%" + req.query.filter.value + "%";
      qrySelect = qrySelect + " AND lower(`longname`) like '" + qfield + "'";
    }
    qrySelect = qrySelect + " ORDER BY datum desc";

    sequelize
      .query(qrySelect, {
        type: Sequelize.QueryTypes.SELECT,
        plain: false,
        logging: console.log,
        raw: false,
      })
      .then((data) => res.json(data));
  },

  removeData: function (req, res) {
    const data = req.body;
    if (data == undefined) {
      throw "Record not correct";
    }
    console.info("delete: ", data);
    Anlaesse.findByPk(data.id)
      .then((anlass) =>
        anlass
          .destroy()
          .then((obj) =>
            res.json({
              id: obj.id,
            })
          )
          .catch((e) => console.error(e))
      )
      .catch((e) => console.log(e));
  },

  addData: function (req, res) {
    var data = req.body;
    console.info("insert: ", data);
    Anlaesse.create(data)
      .then((obj) =>
        res.json({
          id: obj.id,
        })
      )
      .catch((e) => console.error(e));
  },

  updateData: function (req, res) {
    var data = req.body;
    if (data.id == 0 || data.id == null) {
      // insert
      console.info("insert: anlass", data);
      Anlaesse.create(data)
        .then((obj) =>
          res.json({
            id: obj.id,
          })
        )
        .catch((e) => console.error(e));
    } else {
      // update
      console.info("update: ", data);

      Anlaesse.findByPk(data.id)
        .then((anlass) =>
          anlass
            .update(data)
            .then((obj) =>
              res.json({
                id: obj.id,
              })
            )
            .catch((e) => console.error(e))
        )
        .catch((e) => console.error(e));
    }
  },

};

