var Temp = require('./Temp');

var temp = (index, data, callback) => {
    var query = {
        index: index
    };
    
    Temp.findOne(query, function(err, temp){
        if(err){
            console.log("Connect to Database error");
            callback();
            return;
        }
        if(temp){
            temp.temp = data;
            temp.save(function(err){
                callback();
                if(err){
                    console.log("Connect to Database error");
                    return;
                }
                console.log("Successfully save temp data");
            });
        }else{
            var temp_ = new Temp({
                index: index,
                temp: data
            });
            temp_.save(function(err){
                callback();
                if(err){
                    console.log("Connect to Database error");
                    return;
                }
                console.log("Successfully save temp data");
            });
        }
    });
};

module.exports = temp;