const { Sequelize } = require('sequelize');

async function createConnection() {
  global.sequelize = null;

      const conn = await new Sequelize(global.gConfig.database, global.gConfig.db_user, global.cipher.decrypt(global.gConfig.db_pwd), {
          host: global.gConfig.dbhost, 
          port: global.gConfig.port,
          dialect: global.gConfig.dbtype,
          logging: (...msg) => console.log(msg)
        });
      global.sequelize = conn;
      // console.log(global.cipher.encrypt('testtext'));      
    
      try {
        sequelize.authenticate();
      //  sequelize.sync()
      //    .catch((e) => console.error(e));
        console.log("Connecion has been established successfully.");
      } catch (error) {
        console.error("Unable to connect to the database.", errro);
      }
          
}