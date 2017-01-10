var express = require('express');
var mongoose = require('mongoose');

var Sheet = require('./../db/Sheet');

var router = express.Router();

router.post('/', function(req, res) {
    console.log('[POST] load');
    console.log(req.body);
    
    var message = {
        status: {
            error: false,
            success: true,
            edit: false,
            msg: "",
        },
        sheet: {
            cmpstr: "",
            ttlstr: "",
            tmpstr: "",
            abcstr: "",
            abcindex: 0,
            Lstr: "",
            strs: null,
            clef: null
        }
    };

    var query = {
        index: req.body.index
    };

    Sheet.findOne(query, function(err, sheet) {
        if(err) {
            message.status.error = true;
            message.status.success = false;
            message.status.msg = "Connect to Database error";
            res.json(message);
            return console.log(err);
        }
        if(sheet == null) {
            message.status.success = false;
            message.status.msg = "Sheet data doesn't exist";
            res.json(message);
            console.log("Can't find data which index = "+ req.body.index);  
        } else {
            console.log("Checking key...");
            if(req.body.key === sheet.key) {
                message.status.edit = true;
                message.status.msg = "Success load sheet data(editable)";
                message.sheet.cmpstr = sheet.cmpstr;
                message.sheet.ttlstr = sheet.ttlstr;
                message.sheet.tmpstr = sheet.tmpstr;
                message.sheet.abcstr = sheet.abcstr;
                message.sheet.abcindex = sheet.abcindex;
                message.sheet.Lstr = sheet.Lstr;
                message.sheet.strs = sheet.strs;
                message.sheet.clef = sheet.clef;
    
                res.json(message);
                console.log("Key confirmed");
                console.log("Load sheet data(editable):");
                console.log(sheet);
            }
            else {
                message.status.msg = "Success load sheet data(visitable)";
                message.sheet.cmpstr = sheet.cmpstr;
                message.sheet.ttlstr = sheet.ttlstr;
                message.sheet.tmpstr = sheet.tmpstr;
                message.sheet.abcstr = sheet.abcstr;
                message.sheet.abcindex = sheet.abcindex;
                message.sheet.strs = sheet.strs;
                message.sheet.clef = sheet.clef;

                res.json(message);
                console.log("Key error where "+req.body.key+" != "+sheet.key);
                console.log("Load sheet data(visitable):");
                console.log(sheet);
            }
        }
    });
});

module.exports = router;
