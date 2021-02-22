var mongoose = require('./dbconnect')(true);
var Sheet = require('./Sheet')(mongoose);

Sheet.deleteMany({index: {$ne: "WPR21F2BZT"}}, (err, res) => {
    if (err) {
        mongoose.disconnect();
        return console.log(err);
    }
    console.log("deletedCount:", res["deletedCount"]);
    mongoose.disconnect();
});