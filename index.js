"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");
const nedb = require("nedb");

// environment variables
if (process.env.NODE_ENV == undefined)
	process.env.NODE_ENV = 'development';

// config variables
const config = require('./config/config.js');

const app = express();

app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, '/public')));

const db = require('./db')

const adresse = require("./controllers/adresse");
app.get('/adresse/data', adresse.getData);
app.post('/adresse/data', adresse.addData);
app.put('/adresse/data/:id', adresse.updateData);
app.delete('/adresse/data/:id', adresse.removeData);
app.get('/data/getFkData', adresse.getFKData);
app.get('/adresse/data/:id', adresse.getOneData);


  
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