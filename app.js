var express = require('express');
var path = require('path');
var helmet = require('helmet');
var app = express();

var index = require('./routes/index');

app.use(helmet());
app.use('/', index);
app.use(express.static(path.resolve(__dirname, 'public')));

/*app.get('/', function (req, res) {
  res.send('Hello World!');
});
*/
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

