var mongoose = require('./dbconnect.js');

var TempSchema = new mongoose.Schema({
    index: String,
    temp: Array
});
    
var Temp = mongoose.model('MSOEtmp', TempSchema, 'MSOEtmp');

module.exports = Temp;