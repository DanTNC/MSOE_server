var mongoose = require('./dbconnect.js');

var FeedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    type: String,
    message: String
});
    
var Feedback = mongoose.model('feedback', FeedbackSchema, 'feedback');

module.exports = Feedback;