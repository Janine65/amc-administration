const { Sequelize, Model, Deferrable } = require('sequelize');

const sequelize = new Sequelize(global.gConfig.database, global.gConfig.user, global.gConfig.pwd, {
  host:"localhost", port:global.gConfig.port,
  dialect:global.gConfig.dbtype
});

global.sequelize = sequelize; 

try {
  sequelize.authenticate();
  console.log("Connecion has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database.", errro);
}


class Adressen extends Model {
  getFullname() {
    return [this.vorname, this.name].join(' ');
  }
}
Adressen.init({
  id: {
    type: Sequelize.INTEGER, 
    allowNull: true,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  mnr: {
    type: Sequelize.INTEGER, 
    allowNull: true,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "") {
        this.setDataValue('mnr', null);        
      } else {
        this.setDataValue('mnr', value);
      }
    }},
  geschlecht: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    allowNull: false,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "") 
        this.setDataValue('geschlecht', 1);
      else
        this.setDataValue('geschlecht', value);
    }
  },
  name: {type: Sequelize.STRING, allowNull: false},
  vorname: {type: Sequelize.STRING, allowNull: false},
  adresse: {type: Sequelize.STRING, allowNull: false},
  plz: {type: Sequelize.INTEGER, allowNull: false},
  ort: {type: Sequelize.STRING, allowNull: false},
  land: {type: Sequelize.STRING, allowNull: false, defaultValue: "CH"},
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
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "") 
        this.setDataValue('mnr_sam', null);
      else
        this.setDataValue('mnr_sam', value);
    }},
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
    type: Sequelize.DATEONLY,
    defaultValue: new Date("01.01.3000")
  },
  austritt_mail: { 
    type:Sequelize.TINYINT},
  adressenId: { 
    type: Sequelize.INTEGER,
    references: {
      model: Adressen,
      key: 'id'
    },
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "") 
        this.setDataValue('adressenId', null);
      else
        this.setDataValue('adressenId', value);
    }
  },
  allianz: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  notes: Sequelize.BLOB
}, {
  sequelize,
  tableName: 'adressen',
  modelName: 'adressen',
  indexes: [{ unique: true, fields: ['name','vorname','ort'] }]  
});


Adressen.belongsTo(Adressen);
Adressen.hasMany(Adressen);

module.exports = {
  Adressen
};