const { Sequelize, Model, Deferrable } = require('sequelize');

const sequelize = new Sequelize('amcmitglieder', 'webuser', 'Yogi-298294', {
  host:"localhost",
  dialect:"mysql"
});

global.sequelize = sequelize; 

try {
  sequelize.authenticate();
  console.log("Connecion has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database.", errro);
}

class Anrede extends Model {}
Anrede.init( {
  anrede: Sequelize.STRING
}, {
  sequelize,
  tableName: 'Anrede',
  modelName: 'anrede'
});


class Adressen extends Model {
  getFullname() {
    return [this.vorname, this.name].join(' ');
  }
}
Adressen.init({
  mnr: {type: Sequelize.INTEGER, allowNull: false},
  anredeId: {
    type: Sequelize.INTEGER,
    default: 1,
    allowNull: false,
    references: {
      model: Anrede,
      key: 'id',
    }
  },
  name: {type: Sequelize.STRING, allowNull: false},
  vorname: {type: Sequelize.STRING, allowNull: false},
  adresse: {type: Sequelize.STRING, allowNull: false},
  plz: {type: Sequelize.INTEGER, allowNull: false},
  ort: {type: Sequelize.STRING, allowNull: false},
  telefon_p: Sequelize.STRING,
  telefon_g: Sequelize.STRING,
  mobile: Sequelize.STRING,
  email: Sequelize.STRING,
  eintritt: {
    type: Sequelize.DATEONLY,
    defaultValue: Sequelize.NOW
  },
  sam_mitglied: { 
    type:Sequelize.TINYINT,
    allowNull: false,
    defaultValue: 1},
  jahresbeitrag: Sequelize.DECIMAL(19,2),
  mnr_sam: {
    type: Sequelize.INTEGER,
    defaultValue: null},
  vorstand: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  ehrenmitglied: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  revisor: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  austritt: {
    type: Sequelize.DATEONLY
  },
  austritt_mail: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  adressenId: { 
    type: Sequelize.INTEGER,
    references: {
      model: Adressen,
      key: 'id'
    }
  },
  allianz: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  notes: Sequelize.BLOB
}, {
  sequelize,
  tableName: 'Adressen',
  modelName: 'adressen',
  indexes: [{ unique: true, fields: ['name','vorname','ort'] }]  
});

Adressen.belongsTo(Anrede);
Anrede.hasMany(Adressen);

Adressen.belongsTo(Adressen);
Adressen.hasMany(Adressen);

module.exports = {
  Adressen, Anrede
};