module.exports = (mongoose) => {
    var TempSchema = new mongoose.Schema({
        index: String,
        temp: Array
    });
        
    var Temp = mongoose.model('MSOEtmp', TempSchema, 'MSOEtmp');
    
    return Temp;
};