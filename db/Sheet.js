module.exports = (mongoose) => {
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
            tmpstr: String,
            bpmstr: String
        },
        abcstr: String,
        abcindex: Number,
        Lstr: String,
        strs: Array,
        clef: Array,
        voicename: Array,
        musicEnds: Array
      });
    
    var Sheet = mongoose.model('MSOE', SheetSchema, 'MSOE');
    
    return Sheet;
};
