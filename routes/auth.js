var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res) {
	console.log("[GET] '/auth'");
	res.sendFile(path.resolve(__dirname, '../view/auth.html'));
	console.log(path.resolve(__dirname, '../view/auth.html'));
});

module.exports = router;
