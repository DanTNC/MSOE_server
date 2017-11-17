var mongoose = require('./dbconnect');

var SheetSchema = new mongoose.Schema({
    index: String,
    key: String,
    infostrs: {
        edtstr: String,
        cmpstr: String,
        ttlstr: String,
        stlstr: String,
        albstr: String,
        artstr: String,
        tmpstr: String
    },
    abcstr: String,
    abcindex: Number,
    Lstr: String,
    strs: Array,
    clef: Array
  });

var Sheet = mongoose.model('MSOE', SheetSchema, 'MSOE');

module.exports = Sheet;
