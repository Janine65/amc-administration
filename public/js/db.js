const { request } = require('express');
const { Sequelize, Model } = require('sequelize');
const DataTypes = require('sequelize').DataTypes;
const UUIDV4 = require('uuid').v4;

const sequelize = new Sequelize(global.gConfig.database, global.gConfig.db_user, global.cipher.decrypt(global.gConfig.db_pwd), {
  host: "localhost", port: global.gConfig.port,
  dialect: global.gConfig.dbtype
});

global.sequelize = sequelize;

try {
  sequelize.authenticate();
  console.log("Connecion has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database.", errro);
}


class Adressen extends Model {
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
    }
  },
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
  name: { type: Sequelize.STRING, allowNull: false },
  vorname: { type: Sequelize.STRING, allowNull: false },
  adresse: { type: Sequelize.STRING, allowNull: false },
  plz: { type: Sequelize.INTEGER, allowNull: false },
  ort: { type: Sequelize.STRING, allowNull: false },
  land: { type: Sequelize.STRING, allowNull: false, defaultValue: "CH" },
  telefon_p: Sequelize.STRING,
  telefon_g: Sequelize.STRING,
  mobile: Sequelize.STRING,
  email: Sequelize.STRING,
  eintritt: {
    type: Sequelize.DATEONLY,
    defaultValue: Sequelize.NOW
  },
  sam_mitglied: {
    type: Sequelize.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  jahresbeitrag: Sequelize.DECIMAL(19, 2),
  mnr_sam: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('mnr_sam', null);
      else
        this.setDataValue('mnr_sam', value);
    }
  },
  vorstand: {
    type: Sequelize.TINYINT,
    defaultValue: 0
  },
  ehrenmitglied: {
    type: Sequelize.TINYINT,
    defaultValue: 0
  },
  revisor: {
    type: Sequelize.TINYINT,
    defaultValue: 0
  },
  austritt: {
    type: Sequelize.DATEONLY,
    defaultValue: new Date("01.01.3000")
  },
  austritt_mail: {
    type: Sequelize.TINYINT
  },
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
    type: Sequelize.TINYINT,
    defaultValue: 0
  },
  notes: Sequelize.BLOB
  // fullname: {
  //   type: Sequelize.VIRTUAL,
  //   get() {
  //     return `${this.vorname} ${this.name}`;
  //   },
  //   set(value) {
  //     throw new Error('Do not try to set the `fullname` value!');
  //   }
  // }
},
  {
    sequelize,
    tableName: 'adressen',
    modelName: 'adressen',
    indexes: [{ unique: true, fields: ['name', 'vorname', 'ort'] }]
  });

class Anlaesse extends Model {
}
Anlaesse.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: true,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  datum: { type: Sequelize.DATEONLY, allowNull: false },
  name: { type: Sequelize.STRING, allowNull: false },
  beschreibung: { type: Sequelize.STRING, allowNull: false },
  punkte: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 50 },
  istkegeln: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 0 },
  nachkegeln: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 0 },
  istsamanlass: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 0 },
  gaeste: {
    type: Sequelize.INTEGER, allowNull: true, defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('gaeste', null);
      else
        this.setDataValue('gaeste', value);
    }
  },
  anlaesseId: {
    type: Sequelize.INTEGER, allowNull: true,
    references: {
      model: Anlaesse,
      key: 'id'
    },
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('anlaesseId', null);
      else
        this.setDataValue('anlaesseId', value);
    }
  },
  longname: Sequelize.VIRTUAL,
  //   get() {
  //     return `${this.datum} ${this.name}`;
  //   },
  //   set(value) {
  //     throw new Error('Do not try to set the `longname` value!');
  //   }
  // },
  status: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 }
},
  {
    sequelize,
    tableName: 'anlaesse',
    modelName: 'anlaesse',
    indexes: [{ unique: true, fields: ['datum', 'name'] }]
  }
);

class Meisterschaft extends Model {
}
Meisterschaft.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: true,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  mitgliedId: {
    type: Sequelize.INTEGER,
    references: {
      model: Adressen,
      key: 'id'
    }
  },
  eventId: {
    type: Sequelize.INTEGER,
    references: {
      model: Anlaesse,
      key: 'id'
    }
  },
  punkte: {
    type: Sequelize.INTEGER,
    defaultValue: 50
  },
  wurf1: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  wurf2: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  wurf3: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  wurf4: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  wurf5: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  zusatz: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  streichresultat: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
},
  {
    sequelize,
    tableName: 'meisterschaft',
    modelName: 'meisterschaft'
  }
);
class Clubmeister extends Model {
}
Clubmeister.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  jahr: { type: Sequelize.STRING, allowNull: false },
  rang: { type: Sequelize.INTEGER, allowNull: false },
  vorname: { type: Sequelize.STRING, allowNull: false },
  nachname: { type: Sequelize.STRING, allowNull: false },
  mitgliedid: { type: Sequelize.INTEGER, allowNull: false },
  punkte: { type: Sequelize.INTEGER, allowNull: false },
  anlaesse: { type: Sequelize.INTEGER, allowNull: false },
  werbungen: { type: Sequelize.INTEGER, allowNull: false },
  mitglieddauer: { type: Sequelize.INTEGER, allowNull: false },
  status: { type: Sequelize.INTEGER, allowNull: false },
},
  {
    sequelize,
    tableName: 'clubmeister',
    modelName: 'clubmeister'
  }
);


class Kegelmeister extends Model {
}
Kegelmeister.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  jahr: { type: Sequelize.STRING, allowNull: false },
  rang: { type: Sequelize.INTEGER, allowNull: false },
  vorname: { type: Sequelize.STRING, allowNull: false },
  nachname: { type: Sequelize.STRING, allowNull: false },
  mitgliedid: { type: Sequelize.INTEGER, allowNull: false },
  punkte: { type: Sequelize.INTEGER, allowNull: false },
  anlaesse: { type: Sequelize.INTEGER, allowNull: false },
  babeli: { type: Sequelize.INTEGER, allowNull: false },
  status: { type: Sequelize.INTEGER, allowNull: false },
},
  {
    sequelize,
    tableName: 'kegelmeister',
    modelName: 'kegelmeister'
  }
);

Adressen.belongsTo(Adressen);
Adressen.hasMany(Adressen);

Anlaesse.belongsTo(Anlaesse, { as: 'linkedEvent', constraints: false, foreignKey: 'anlaesseId' });
Meisterschaft.belongsTo(Anlaesse, { as: 'linkedEvent', constraints: true, foreignKey: 'eventId' });
Meisterschaft.belongsTo(Adressen, { as: 'teilnehmer', constraints: true, foreignKey: 'mitgliedId' });


class Parameter extends Model {
}
Parameter.init({
  key: { type: Sequelize.STRING, allowNull: false },
  value: { type: Sequelize.STRING, allowNull: false },
},
  {
    sequelize,
    tableName: 'parameter',
    modelName: 'parameter'
  }
);

class Session extends Model {
}
Session.init({
  sid: {
    type: Sequelize.STRING
  },
  userId: Sequelize.STRING,
  expires: Sequelize.DATE,
  data: Sequelize.STRING(50000),
},
  {
    sequelize,
    tableName: 'sessions',
    modelName: 'Session'
  });


class User extends Model {
}
User.init({
  userid: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  salt: DataTypes.STRING,
  password: DataTypes.STRING,
  role: { type: DataTypes.ENUM('user', 'admin'), default: 'user' },
  last_login: DataTypes.DATE
},
  {
    sequelize,
    tableName: 'user',
    modelName: 'user'
  });

  class FiscalYear extends Model {

  }
  FiscalYear.init({
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: 0
    },
    year: DataTypes.STRING,
    name: DataTypes.STRING,
    state: DataTypes.INTEGER,
  },
    {
      sequelize,
      tableName: 'fiscalyear',
      modelName: 'fiscalyear'
    });
  
  
class Account extends Model {

}
Account.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  name: DataTypes.STRING,
  level: DataTypes.INTEGER,
  order: DataTypes.INTEGER,
  status: DataTypes.INTEGER
},
  {
    sequelize,
    tableName: 'account',
    modelName: 'account'
  });

class Journal extends Model {
}
Journal.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    defaultValue: 0
  },
  from_account: {
    type: Sequelize.INTEGER,
    references: {
      model: Account,
      key: 'id'
    }
  },
  to_account: {
    type: Sequelize.INTEGER,
    references: {
      model: Account,
      key: 'id'
    }
  },
  date: DataTypes.DATEONLY,
  memo: DataTypes.STRING,
  journalNo: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('journalNo', null);
      else
        this.setDataValue('journalNo', value);
    }
  },
  amount: DataTypes.DECIMAL(7, 2),
  status: DataTypes.INTEGER
},
  {
    sequelize,
    tableName: 'journal',
    modelName: 'journal'
  });

  Journal.belongsTo(Account, { as: 'fromAccount', constraints: true, foreignKey: 'from_account' });
  Journal.belongsTo(Account, { as: 'toAccount', constraints: true, foreignKey: 'to_account' });

module.exports = {
  Adressen, Anlaesse, Parameter, Meisterschaft, Clubmeister, Kegelmeister, User, Session, Account, Journal, FiscalYear,
};