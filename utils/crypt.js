var crypto = require('crypto');

var crypt = new function () {
    this.randomIndex = function() {
        return crypto.randomBytes(32).toString('base64').substr(0,10).toUpperCase().replace(/\+/g, '-').replace(/\//g, '_');
    }
    this.randomKey = function() {
        return crypto.randomBytes(32).toString('base64').substr(0,20).toUpperCase().replace(/\+/g, '-').replace(/\//g, '_');
    }
};

module.exports = crypt;

if (require.main === module){
    for(var i = 0;i<10;i++){
        console.log(crypt.randomIndex());
    }
}