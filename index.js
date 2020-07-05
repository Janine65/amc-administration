"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");
const nedb = require("nedb");
const nodemailer = require("nodemailer");

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

  console.log(req, res);

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "janine@automoto-sr.info", // generated ethereal user
      pass: "Yogi-2982", // generated ethereal password
    }
  });

  const info = transporter.sendMail({
        from: '"Janine Franken" <janine@automoto-sr.info>', // sender address
        to: "janine@olconet.com", // list of receivers
        subject: email.email_subject, // Subject line
        text: email.email_body, // plain text body
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