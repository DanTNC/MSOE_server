var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var app = express();

var index = require('./routes/index');
var load = require('./routes/load');
var save = require('./routes/save');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(helmet());

app.use('/', index);
app.use('/load', load);
app.use('/save', save);

app.use(express.static(path.resolve(__dirname, 'public')));

var port = 7725

app.listen(port, function () {
  console.log('Example app listening on port '+port);
});

