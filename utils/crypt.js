var crypto = require('crypto');

var crypt = new function () {
    this.randomIndex = function() {
        return crypto.randomBytes(32).toString('base64').substr(0,10).toUpperCase();
    }
    this.randomKey = function() {
        return crypto.randomBytes(32).toString('base64').substr(0,20).toUpperCase();
    }
};

module.exports = crypt;
