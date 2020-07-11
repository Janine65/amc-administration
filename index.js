const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");
const nedb = require("nedb");
const nodemailer = require("nodemailer");
const _ = require("./public/js/cipher");
const key = "ASECRET";


// environment variables
if (process.env.NODE_ENV == undefined)
	process.env.NODE_ENV = 'development';

// config variables
const config = require('./config/config.js');

const app = express();

app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, '/public')));

const db = require('./public/js/db')

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


const parameter = require("./public/js/controllers/parameter");
app.get('/Parameter/data', parameter.getData);
app.post('/Parameter/data', parameter.updateData);
app.put('/Parameter/data', parameter.updateData);
app.delete('/Parameter/data', parameter.removeData);

console.log(global);

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
  
app.listen(global.gConfig.node_port, () => {
    console.log(`${global.gConfig.app_name} listening on port ${global.gConfig.node_port}`);
});