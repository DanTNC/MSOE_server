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
            infostrs: {},
            abcstr: "",
            abcindex: 0,
            Lstr: "",
            strs: null,
            clef: null,
            voicename: null,
            musicEnds: null
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
                message.sheet.infostrs = sheet.infostrs;
                message.sheet.abcstr = sheet.abcstr;
                message.sheet.abcindex = sheet.abcindex;
                message.sheet.Lstr = sheet.Lstr;
                message.sheet.strs = sheet.strs;
                message.sheet.clef = sheet.clef;
                message.sheet.voicename = sheet.voicename;
                message.sheet.musicEnds = sheet.musicEnds;
    
                res.json(message);
                console.log("Key confirmed");
                console.log("Load sheet data(editable):");
                console.log(sheet);
            }
            else {
                message.status.msg = "Success load sheet data(visitable)";
				message.status.edit = false;
                message.sheet.infostrs = sheet.infostrs;
                message.sheet.abcstr = sheet.abcstr;
                message.sheet.abcindex = sheet.abcindex;
				message.sheet.Lstr = sheet.Lstr;
                message.sheet.strs = sheet.strs;
                message.sheet.clef = sheet.clef;
                message.sheet.voicename = sheet.voicename;
                message.sheet.musicEnds = sheet.musicEnds;

                res.json(message);
                console.log("Key error where "+req.body.key+" != "+sheet.key);
                console.log("Load sheet data(visitable):");
                console.log(sheet);
            }
        }
    });
});

module.exports = router;
