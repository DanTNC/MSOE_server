var express = require('express');
var mongoose = require('mongoose');

var Sheet = require('./../db/Sheet');
var crypt = require('./../utils/crypt');

var router = express.Router();

router.post('/', function(req, res) {
    console.log('[POST] /save');

    var message = {
        status: {
            error: false,
            success: true,
            msg: ""
        },
        url: {
            index: "",
            key: ""
        }
    };
    if(req.body.insert === 'true') { //insert new sheet data
        console.log("Preprare to insert new sheet data...");
        var index = "";
        var key = "";
        while(1) {
            var check = true;
            index = crypt.randomIndex();
                
            var query = {
                index: req.body.index  
            };

            //check if there is dulpicate index
            Sheet.findOne(query, function(err, sheet) {
                if(err) {
                    message.status.error = true;
                    message.status.success = false;
                    message.status.msg = "Connect to Database error";
                    res.json(message);
                    return console.log(err);
                }
                if(sheet == null)
                    check = true;
                else
                    check = false;
                                                                                                            
            });
            if(check === true) break;
        }
        if(message.status.error === false) {
            key = crypt.randomKey();
            console.log("Create index = "+index+", key = "+key);
            console.log("Now insert new sheet data");
            var SheetData = new Sheet({
               index: index,
               key: key,
               cmpstr: req.body.cmpstr,
               ttlstr: req.body.ttlstr,
               tmpstr: req.body.tmpstr,
               abcstr: req.body.abcstr,
               abcindex: req.body.abcindex,
               Lstr: req.body.Lstr,
               strs: req.body.strs,
               clef: req.body.clef
            });

            SheetData.save(function(err) {
                if(err) {
                    message.status.error = true;
                    message.status.success = false;
                    message.status.msg = "Connect to Database error";
                    res.json(message);
                    return console.log(err);
                }
                
                message.status.msg = "Success save sheet data";
                message.url.index = index;
                message.url.key = key;
                res.json(message);
                console.log("Success insert sheet data");
                console.log(SheetData);
            });
        }
    }
    else { //update sheet data
        console.log("Preprare to update new sheet data...");
        var query = {
            index: req.body.index
        };
        var exist = false;

        Sheet.findOne(query, function(err, sheet) { //check if sheet data exist
            if(err) {
                message.status.error = true;
                message.status.success = false;
                message.status.type = "Connect to Database error";
                res.json(message);
                return console.log(err);
            }
            if(sheet == null) {
                message.status.success = false;
                message.status.msg = "Sheet data doesn't exist";
                exist = false;
                console.log("Can't not find data which index = "+ req.body.index);
            }
            else {
                exist = true;
                console.log("Data Exist, checking key ...");
                if(req.body.key === sheet.key) {
                    console.log("Key confirmed");
                }
                else {
                    message.status.success = false;
                    message.status.msg = "Key error";
                    res.json(message);
                    console.log("Key error where "+req.body.key+" != "+sheet.key);
                }
            }
        });
        if((message.status.error=== false) && (message.status.success===true)) { //update sheet data
            var SheetData = {
                index: req.body.index,
                key: req.body.key,
                cmpstr: req.body.cmpstr,
                ttlstr: req.body.ttlstr,
                tmpstr: req.body.tmpstr,
                abcstr: req.body.abcstr,
                abcindex: req.body.abcindex,
                Lstr: req.body.Lstr,
                strs: req.body.strs,
                clef: req.body.clef
            };
            Sheet.update(query, SheetData,  function(err) {
                if(err) {
                    message.status.error = true;
                    message.status.success = false;
                    message.status.type = "Connect to Database error";
                    res.json(message);
                    return console.log(err);
                }
                message.status.msg = "Success save sheet data";
                message.url.index = req.body.index;
                message.url.key = req.body.key;
                res.json(message);
                console.log("Success updata sheet data");
                console.log(SheetData);
            });            
        }
    }
});

module.exports = router;
