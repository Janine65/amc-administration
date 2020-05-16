const { Sequelize, Model, Deferrable } = require('sequelize');

const sequelize = new Sequelize('amcmitglieder', 'webuser', 'Yogi-298294', {
  host:"localhost",
  dialect:"mysql"
});

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
  id: {type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true},
  anrede_id: {
    type: Sequelize.INTEGER,
    default: 1,
    references: {
      model: Anrede,
      key: 'id',
    }
  },
  name: Sequelize.STRING,
  vorname: Sequelize.STRING,
  adresse: Sequelize.STRING,
  plz: Sequelize.INTEGER,
  ort: Sequelize.STRING,
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
    defaultValue: 1},
  jahresbeitrag: Sequelize.DECIMAL(19,4),
  mnr_sam: Sequelize.INTEGER,
  vorstand: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  ehrenmitglied: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  revisor: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  austritt: Sequelize.DATEONLY,
  austritt_mail: { 
    type:Sequelize.TINYINT,
    defaultValue: 0},
  geworben_von: { 
    type: Sequelize.INTEGER,
    references: {
      model: Adressen,
      key: 'id'
    }
  },
  allianz: { 
    type:Sequelize.TINYINT,
    defaultValue: '0'},
  notes: Sequelize.BLOB
}, {
  sequelize,
  tableName: 'Adressen',
  modelName: 'adressen',
  indexes: [{ unique: true, fields: ['name','vorname','ort'] }]  
});

//Anrede.hasMany(Adressen);


module.exports = {
  Adressen, Anrede
};