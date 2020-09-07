var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs');

var data = fs.readFileSync(path.resolve(__dirname, "mongo.json"), 'utf-8');
var account = JSON.parse(data);

// mongoose.connect('mongodb://'+account.id+':'+process.env.mlab+'@ds147454.mlab.com:47454/'+account.db, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect('mongodb+srv://'+account.id+':'+process.env.mlab+'@msoe.iidb2.gcp.mongodb.net/'+account.db+'?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

module.exports = mongoose;
