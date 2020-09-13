
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require("path");
const nedb = require("nedb");
const nodemailer = require("nodemailer");
const _ = require("./public/js/cipher");
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data
const Sequelize = require("sequelize");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const system = require("./public/js/system");
const https = require("https");
const fs = require('fs');
//const argon = require("argon2");

// environment variables
if (process.env.NODE_ENV == undefined)
	process.env.NODE_ENV = 'development';

// config variables
const config = require('./config/config.js');

const db = require('./public/js/db')

var Session = global.sequelize.define("Session", {
  sid: {
    type: Sequelize.STRING
  },
  userId: Sequelize.STRING,
  expires: Sequelize.DATE,
  data: Sequelize.STRING(50000),
});


function extendDefaultFields(defaults, session) {
  return {
    data: defaults.data,
    expires: defaults.expires,
    userId: session.userId,
  };
}
 
var store = new SequelizeStore({
  db: sequelize,
  table: "Session",
  extendDefaultFields: extendDefaultFields,
  checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
  expiration: 30 * 60 * 1000  // The maximum age (in milliseconds) of a valid session.
});

const app = express();
// 
app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, '/public')));
  
app.use(helmet());
app.use(
  session({
    secret: global.cipher.secret,
    saveUninitialized: true,
    store: store,
    resave: false, // we support the touch method so per the express-session docs this should be set to false
    proxy: true, // if you do SSL outside of node.
  })
);

const adresse = require("./public/js/controllers/adresse");
app.get('/Adressen/data', adresse.getData);
app.post('/Adressen/data', adresse.updateData);
app.put('/Adressen/data', adresse.updateData);
app.delete('/Adressen/data', adresse.removeData);
app.get('/data/getFkData', adresse.getFKData);
app.get('/Adressen/data', adresse.getOneData);
app.get('/Adressen/getOverviewData', adresse.getOverviewData);

app.post('/Adressen/email', sendEmail);

function sendEmail(req, res) {
  const email = req.body;

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: global.gConfig.smtp,
    port: global.gConfig.smtp_port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: global.gConfig.smtp_user, // generated ethereal user
      pass: global.cipher.decrypt(global.gConfig.smtp_pwd), // generated ethereal password
    }
  });

  const info = transporter.sendMail({
        from: global.gConfig.email_from, // sender address
        to: (global.gConfig.email_to == "" ? email.email_to : global.gConfig.email_to), // list of receivers
        subject: email.email_subject, // Subject line
        text: decodeURI(email.email_body), // plain text body
        html: email.email_body, // html body
    })
    .then((result) => console.info(result))
    .catch((error) => console.error(error));
      
}
  
const anlaesse = require("./public/js/controllers/anlaesse");
app.get('/Anlaesse/data', anlaesse.getData);
app.post('/Anlaesse/data', anlaesse.updateData);
app.put('/Anlaesse/data', anlaesse.updateData);
app.delete('/Anlaesse/data', anlaesse.removeData);
app.delete('/Anlaesse/data', anlaesse.removeData);
app.get('/Anlaesse/getFkData', anlaesse.getFKData);
app.get('/Anlaesse/data/:id', anlaesse.getOneData);
app.get('/Anlaesse/getOverviewData', anlaesse.getOverviewData);

const meisterschaft = require("./public/js/controllers/meisterschaft");
app.get('/Meisterschaft/data', meisterschaft.getData);
app.post('/Meisterschaft/data', meisterschaft.addData);
app.put('/Meisterschaft/data', meisterschaft.updateData);
app.delete('/Meisterschaft/data', meisterschaft.removeData);
app.get('/Meisterschaft/getOneData', meisterschaft.getOneData);
app.get('/Meisterschaft/getFkData', meisterschaft.getFKData);

const clubmeister = require("./public/js/controllers/clubmeister");
app.get('/Clubmeister/data', clubmeister.getData);
app.get('/Clubmeister/refresh', clubmeister.calcMeister);
app.get('/Clubmeister/getOverviewData', clubmeister.getOverviewData);
const kegelmeister = require("./public/js/controllers/kegelmeister");
app.get('/Kegelmeister/data', kegelmeister.getData);
app.get('/Kegelmeister/refresh', kegelmeister.calcMeister);
app.get('/Kegelmeister/getOverviewData', kegelmeister.getOverviewData);


const parameter = require("./public/js/controllers/parameter");
app.get('/Parameter/data', parameter.getData);
app.post('/Parameter/data', upload.array(), parameter.updateData);
app.put('/Parameter/data', upload.array(), parameter.updateData);
app.get('/Parameter/getOneDataByKey', parameter.getOneDataByKey);

global.Parameter = new Map();
parameter.getGlobal();

console.log(global.Parameter);

/**
 * A common handler to deal with DB operation errors.  Returns a 500 and an error object.
 *
 * @param inError    Error object from the DB call.
 * @param inResponse The response being serviced.
 */
const commonErrorHandler = function(inError, inResponse) {

console.log(inError);
inResponse.status(500);
inResponse.send(`{ "error" : "Server error" }`);

}; /* End commonErrorHandler(). */

process.stdout.on('error', function( err ) {
  if (err.code == "EPIPE") {
      process.exit(0);
  }
});

const options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem'),
  ca: fs.readFileSync('server.key')
};

https.createServer(options, app).listen(global.gConfig.node_port, () => {
  console.log('%s listening on port %d in %s mode - Version %s', global.gConfig.app_name, global.gConfig.node_port, app.settings.env, global.system.version);
});

