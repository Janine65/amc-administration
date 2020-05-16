var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');

var app = express();
var bars = exphbs({ 
	defaultLayout: 'main'
});

app.engine('handlebars', bars);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(require("path").join(__dirname, 'public')));

//static pages
var menu = require("./menu");
app.get('/', 	 (req, res) => res.render('home', menu(req) ));
app.get('/tree', (req, res) => res.render('tree', menu(req) ));
app.get('/grid', (req, res) => res.render('grid', menu(req) ));

var grid = require("./controllers/grid");
app.get('/grid/data', grid.getData);
app.post('/grid/insert', grid.addData);
app.put('/grid/update', grid.updateData);
app.delete('/grid/delete', grid.removeData);

app.listen(3050);