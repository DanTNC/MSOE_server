module.exports = (Temp, index, callback) => {
    var query = {
        index: index
    };
    
    Temp.findOne(query, function(err, temp){
        if(err){
            console.log("Connect to Database error");
            callback([]);
            return;
        }
        if(temp){
            callback(temp.temp);
        }else{
            callback([]);
        }
    });
};