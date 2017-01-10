var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs');

var data = fs.readFileSync(path.resolve(__dirname, "mongo.json"), 'utf-8');
var account = JSON.parse(data);

mongoose.connect('mongodb://'+account.id+':'+account.pwd+'@localhost/MSOE');

module.exports = mongoose;
