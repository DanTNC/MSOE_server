var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req,res) {
	console.log("[GET] '/'");
	res.sendFile(path.resolve(__dirname, '../view/index.html'));
	console.log(path.resolve(__dirname, '../view/index.html'));
});

module.exports = router;
