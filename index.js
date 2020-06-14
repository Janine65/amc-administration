var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');

// environment variables
if (process.env.NODE_ENV == undefined)
	process.env.NODE_ENV = 'development';

// config variables
const config = require('./config/config.js');

var app = express();

// app.get('/', (req, res) => {
//     res.json(global.gConfig);
// });

var bars = exphbs({ 
	defaultLayout: 'main'
});


app.engine('handlebars', bars);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(require("path").join(__dirname, 'public')));

//static pages
// var menu = require("./menu");
// app.get('/', 	 (req, res) => res.render('home', menu(req) ));
// app.get('/grid', (req, res) => res.render('grid', menu(req) ));
app.get('/', 	 (req, res) => res.render('home' ));
app.get('/grid', (req, res) => res.render('grid' ));

var grid = require("./controllers/grid");
app.get('/grid/data', grid.getData);
app.post('/grid/data', grid.addData);
app.put('/grid/data/:id', grid.updateData);
app.delete('/grid/data/:id', grid.removeData);

app.get('/data/getFkData', grid.getFKData);

app.get('/grid/data/:id', grid.getOneData);

//app.listen('3050');
app.listen(global.gConfig.node_port, () => {
    console.log(`${global.gConfig.app_name} listening on port ${global.gConfig.node_port}`);
});