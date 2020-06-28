"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");
const nedb = require("nedb");
const sendmail = require("sendmail")();

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
app.get('/adresse/data', adresse.getData);
app.post('/Adressen/data', adresse.updateData);
app.put('/Adressen/data/:id', adresse.updateData);
app.delete('/Adressen/data/:id', adresse.removeData);
app.get('/data/getFkData', adresse.getFKData);
app.get('/Adressen/data/:id', adresse.getOneData);
app.get('/Adressen/getOverviewData', adresse.getOverviewData);

app.post('/Adressen/email', sendEmail);

    function sendEmail(req, res) {
      const email = req.body;

      console.log(req, res);

      sendmail({
        from: 'info@automoto-sr.info',
        to: 'janine@olconet.com',
        subject: email.email_subject,
        html: email.email_body,
      }, function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
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
  
app.listen(global.gConfig.node_port, () => {
    console.log(`${global.gConfig.app_name} listening on port ${global.gConfig.node_port}`);
});