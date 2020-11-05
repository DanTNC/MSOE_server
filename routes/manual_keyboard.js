var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res) {
	console.log("[GET] '/manual_keyboard'");
	res.sendFile(path.resolve(__dirname, '../view/manual_keyboard.html'));
	console.log(path.resolve(__dirname, '../view/manual_keyboard.html'));
});

module.exports = router;
