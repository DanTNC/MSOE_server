var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs');

module.exports = (testing) => {
    if (testing === undefined) {
        testing = false;
    }

    var data;
    if (testing) {
        data = fs.readFileSync(path.resolve(__dirname, "mongo-test.json"), 'utf-8');
    } else {
        data = fs.readFileSync(path.resolve(__dirname, "mongo-prod.json"), 'utf-8');
    }
    var account = JSON.parse(data);
    
    mongoose.connect(
        'mongodb+srv://'+account.id+':'+process.env.mlab+'@msoe.iidb2.gcp.mongodb.net/msoe?retryWrites=true&w=majority',
        {useNewUrlParser: true, useUnifiedTopology: true, dbName: account.db}
    );
    
    return mongoose;
};
