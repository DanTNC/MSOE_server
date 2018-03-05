var express = require('express');
var CID = process.env.clientID;

var router = express.Router();

router.post('/', function(req, res) {
    console.log('[POST] CID');
    console.log(req.body);
    
    res.json({"CID":CID});
});

module.exports = router;