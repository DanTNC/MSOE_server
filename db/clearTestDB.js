var fs = require('fs');
var path = require('path');

mongo_json = fs.readFileSync(path.resolve(__dirname, "mongo-test.json"), 'utf-8');
fs.writeFileSync(path.resolve(__dirname, "mongo.json"), mongo_json, 'utf-8');

var mongoose = require('./dbconnect');
var Sheet = require('./Sheet');

Sheet.deleteMany({index: {$ne: "WPR21F2BZT"}}, (err, res) => {
    if (err) {
        mongoose.disconnect();
        return console.log(err);
    }
    console.log(res);
    mongoose.disconnect();
});