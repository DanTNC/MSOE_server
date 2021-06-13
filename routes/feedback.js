var express = require('express');
var router = express.Router();

module.exports = (Feedback) => {
    router.post('/', function(req, res) {
        console.log('[POST] /feedback');
        
        var message = {status:{error:false}};
        var type;
        switch(req.body.type){
            case "1":
                type = "S";
                break;
            case "2":
                type = "FP";
                break;
            case "3":
                type = "BR";
                break;
            case "4":
                type = "G";
                break;
            default:
                message.status.error = true;
                message.status.msg = "Type error";
                res.json(message);
                return console.log("undefined type: " + req.body.type);
        }
        
        var FeedbackData = new Feedback({
            name: req.body.name,
            email: req.body.email,
            type: type,
            message: req.body.message
        });
    
        FeedbackData.save(function(err) {
            if(err) {
                message.status.error = true;
                message.status.msg = "Connect to Database error";
                res.json(message);
                return console.log(err);
            }
            
            message.status.msg = "Success save Feedback data";
            res.json(message);
            console.log("Success insert feedback data");
            console.log(FeedbackData);
        });
    });
    
    return router;
};