const { Sequelize, Model, Association } = require('sequelize');
const { extend } = require('underscore');
const DataTypes = require('sequelize').DataTypes;
const UUIDV4 = require('uuid').v4;

class Adressen extends Model {
}
Adressen.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
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
    type: Sequelize.BOOLEAN,
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
    type: Sequelize.BOOLEAN,
    defaultValue: 0
  },
  ehrenmitglied: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0
  },
  revisor: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0
  },
  austritt: {
    type: Sequelize.DATEONLY,
    defaultValue: new Date("01.01.3000")
  },
  austritt_mail: {
    type: Sequelize.BOOLEAN
  },
  adressenid: {
    type: Sequelize.INTEGER,
    references: {
      model: Adressen,
      key: 'id'
    },
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('adressenid', null);
      else
        this.setDataValue('adressenid', value);
    }
  },
  allianz: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0
  },
  notes: Sequelize.STRING
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
    //indexes: [{ unique: true, fields: ['name', 'vorname', 'ort'] }]
  });

class Anlaesse extends Model {
}
Anlaesse.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  datum: { type: Sequelize.DATEONLY, allowNull: false },
  name: { type: Sequelize.STRING, allowNull: false },
  beschreibung: { type: Sequelize.STRING, allowNull: false },
  punkte: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 50 },
  istkegeln: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: 0 },
  nachkegeln: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: 0 },
  istsamanlass: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: 0 },
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
  anlaesseid: {
    type: Sequelize.INTEGER, allowNull: true,
    references: {
      model: Anlaesse,
      key: 'id'
    },
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('anlaesseid', null);
      else
        this.setDataValue('anlaesseid', value);
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
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  mitgliedid: {
    type: Sequelize.INTEGER,
    references: {
      model: Adressen,
      key: 'id'
    }
  },
  eventid: {
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
  total_kegel: {
    type: Sequelize.INTEGER,
    set() {
      throw new Error('Do not try to set the total_kegel value!');
    }
  }
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
    primaryKey: true
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

Adressen.belongsTo(Adressen, {foreignKey: 'adressenid'});
Adressen.hasMany(Adressen, {foreignKey: 'adressenid'});

Anlaesse.belongsTo(Anlaesse, { as: 'linkedEvent', foreignKey: 'anlaesseid' });
Anlaesse.hasMany(Meisterschaft, { foreignKey: 'eventid' });
Meisterschaft.belongsTo(Anlaesse, { as: 'linkedEvent', constraints: true, foreignKey: 'eventid' });
Meisterschaft.belongsTo(Adressen, { as: 'teilnehmer', constraints: true, foreignKey: 'mitgliedid' });
Adressen.hasMany(Meisterschaft, { foreignKey: 'mitgliedid' });


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
  userid: Sequelize.STRING,
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
  role: { type: DataTypes.ENUM('user', 'admin', 'revisor'), default: 'user' },
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
      primaryKey: true
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
    primaryKey: true
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
    primaryKey: true
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
  journalno: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    set(value) {
      // einen empty String zu Null konvertieren
      if (value == "")
        this.setDataValue('journalno', null);
      else
        this.setDataValue('journalno', value);
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
class Receipt extends Model {
}
Receipt.init({
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  receipt: DataTypes.STRING
},
{
  sequelize,
  tableName: 'receipt',
  modelName: 'receipt'
});

class JournalReceipt extends Model {
}
JournalReceipt.init({
},
  {
    sequelize,
    tableName: 'con_journal_receipt',
    modelName: 'journalreceipt'
  });

  Journal.belongsTo(Account, { as: 'fromAccount', constraints: true, foreignKey: 'from_account' });
  Journal.belongsTo(Account, { as: 'toAccount', constraints: true, foreignKey: 'to_account' });
  Receipt.belongsToMany(Journal, {as: 'journals', through: JournalReceipt, foreignKey: 'journalid', otherKey: 'receiptid' });
  Receipt.hasMany(JournalReceipt);
  Journal.belongsToMany(Receipt, {as: 'receipts', through: JournalReceipt, foreignKey: 'receiptid', otherKey: 'journalid' });
  Journal.hasMany(JournalReceipt);
  Account.hasMany(Journal, { as: 'fromAccount', constraints: true, foreignKey: 'from_account' });
  Account.hasMany(Journal, { as: 'toAccount', constraints: true, foreignKey: 'to_account' });

  class Budget extends Model {
  }
  Budget.init({
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    account: {
      type: Sequelize.INTEGER,
      references: {
        model: Account,
        key: 'id'
      }
    },
    year: DataTypes.INTEGER,
    memo: DataTypes.STRING,
    amount: DataTypes.DECIMAL(7, 2)
  },
    {
      sequelize,
      tableName: 'budget',
      modelName: 'budget'
    });
  
    Budget.belongsTo(Account, { as: "acc", constraints: true, foreignKey: 'account' });
    Account.hasMany(Budget, { constraints: true, foreignKey: 'account' });
  
  module.exports = {
  Adressen, Anlaesse, Parameter, Meisterschaft, Clubmeister, Kegelmeister, User, Session, Account, Journal, FiscalYear, Budget, Receipt, JournalReceipt, 
};

