var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res) {
	console.log("[GET] '/mocha_test'");
	res.sendFile(path.resolve(__dirname, '../view/mocha_test.html'));
	console.log(path.resolve(__dirname, '../view/mocha_test.html'));
});

module.exports = router;
