
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require("path");
const nodemailer = require("nodemailer");
const _ = require("./public/js/cipher");
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data
const expresssession = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(expresssession.Store);
const system = require("./public/js/system");
const https = require("https");
const fs = require('fs');
const passport = require('passport');
const fileUpload = require('express-fileupload');

// environment variables
if (process.env.NODE_ENV == undefined)
	process.env.NODE_ENV = 'development';

// config variables
const config = require('./config/config.js');

const db = require('./public/js/db')

var Session = db.Session;

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

var expireDate = new Date();
expireDate.setDate(expireDate.getDate() + 1);

app.use(helmet());
app.use(
  expresssession({
    key: 'user_sid',
    secret: global.cipher.secret,
    saveUninitialized: true,
    store: store,
    resave: false, // we support the touch method so per the express-session docs this should be set to false
    proxy: true, // if you do SSL outside of node.
    cookie: { expires: expireDate }
  })
);

app.use(passport.initialize());
app.use(passport.session());

const userRouter = require('./public/js/controllers/user');
//renders register view
app.get('/user/register', userRouter.registerView);
app.post('/user/register', userRouter.registerPost);
app.post('/user/login', userRouter.loginUser);
app.post('/user/logout',function(req, res){
  req.logout();
  res.redirect('/');
});

passport.serializeUser(function(user, done) {
  done(null, {id: user.id});
});
passport.deserializeUser(function(user, done) {
  done(null, {id: user.id});
});

const exportData = require("./public/js/controllers/exports");

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

  let email_from = global.gConfig.defaultEmail;
  if (email.email_signature != "") {
    email_from = email.email_signature;
    let email_signature = fs.readFileSync("./public/assets/" + email.email_signature + ".html")
    email.email_body += "<p>" + email_signature + "</p>";
  }
  // console.log(email);
  let emailConfig = global.gConfig[email_from];
  console.log(emailConfig);

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtp,
    port: emailConfig.smtp_port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: emailConfig.smtp_user, // generated ethereal user
      pass: global.cipher.decrypt(emailConfig.smtp_pwd), // generated ethereal password
    }
  });

  let attachments = []

  if (email.uploadFiles) {
    var files = email.uploadFiles.split(',');
    files.forEach(file => {
      attachments.push({filename: file, path: path.join(__dirname, '/public/uploads/'+file)});
    });
  }

  transporter.sendMail({
        from: emailConfig.email_from, // sender address
        to: email.email_an, // list of receivers
        cc: email.email_cc,
        bcc: email.email_bcc,
        attachments: attachments,
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
app.post('/Anlaesse/sheet', exportData.writeExcelTemplate);
app.post('/Anlaesse/writeAuswertung', exportData.writeAuswertung);

const meisterschaft = require("./public/js/controllers/meisterschaft");
app.get('/Meisterschaft/data', meisterschaft.getData);
app.post('/Meisterschaft/data', meisterschaft.addData);
app.put('/Meisterschaft/data', meisterschaft.updateData);
app.delete('/Meisterschaft/data', meisterschaft.removeData);
app.get('/Meisterschaft/getOneData', meisterschaft.getOneData);
app.get('/Meisterschaft/getFkData', meisterschaft.getFKData);
app.get('/Meisterschaft/mitglied', meisterschaft.getMitgliedData);
app.get('/Meisterschaft/getChartData', meisterschaft.getChartData);

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

const fiscalyear = require("./public/js/controllers/fiscalyear");
app.get('/Fiscalyear/data', fiscalyear.getData);
app.post('/Fiscalyear/data', upload.array(), fiscalyear.addData);
app.put('/Fiscalyear/data', upload.array(), fiscalyear.updateData);
app.delete('/Fiscalyear/data', fiscalyear.removeData);
app.get('/Fiscalyear/getFkData', fiscalyear.getFKData);
app.get('/Fiscalyear/getOneData', fiscalyear.getOneData);
app.get('/Fiscalyear/export', exportData.writeExcelData);

const account = require("./public/js/controllers/account");
app.get('/Account/data', account.getData);
app.post('/Account/data', upload.array(), account.addData);
app.put('/Account/data', upload.array(), account.updateData);
app.delete('/Account/data', account.removeData);
app.get('/Account/getFkData', account.getFKData);
app.get('/Account/showData', account.getAccountSummary);

const journal = require("./public/js/controllers/journal");
app.get('/Journal/data', journal.getData);
app.post('/Journal/data', upload.array(), journal.addData);
app.put('/Journal/data', upload.array(), journal.updateData);
app.delete('/Journal/data', journal.removeData);
app.post('/Journal/import', journal.importJournal);

// fileupload router
app.use(fileUpload({debug: true, useTempFiles: true, tempFileDir: '/tmp/'}));

app.post('/uploadFiles', fncUploadFiles);

function fncUploadFiles(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    console.error('status 400 : No files were uploaded');
    res.send('{"status" : "server", "error" : "status 400 : No files were uploaded"}');
    return;
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let uploadFiles = req.files.upload;

  // Use the mv() method to place the file somewhere on your server
  let newFileName = path.join(__dirname, '/public/uploads/'+uploadFiles.name);
  uploadFiles.mv(newFileName, function(err) {
    if (err) {
      console.error(err);
      res.send('{"status" : "error", "error" : "' + err + '"}');
      return;
    }
    res.send('{"status" : "server", "sname" : "' + newFileName + '"}');
  });
}


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
  ca: fs.readFileSync('chain.pem')
};

https.createServer(options, app).listen(global.gConfig.node_port, () => {
  console.log('%s listening on port %d in %s mode - Version %s', global.gConfig.app_name, global.gConfig.node_port, app.settings.env, global.system.version);
});

