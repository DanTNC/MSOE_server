var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res) {
	console.log("[GET] '/mannual'");
	res.sendFile(path.resolve(__dirname, '../view/mannual.html'));
	console.log(path.resolve(__dirname, '../view/mannual.html'));
});

module.exports = router;
