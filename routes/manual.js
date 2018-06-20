var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res) {
	console.log("[GET] '/manual'");
	res.sendFile(path.resolve(__dirname, '../view/manual.html'));
	console.log(path.resolve(__dirname, '../view/manual.html'));
});

module.exports = router;
