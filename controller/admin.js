var express = require('express');
var router = express.Router();

module.exports = function(dataAccess) {

	router.get('/', function(req, res, next) {
		let db = dataAccess.getDb();
		let status = {
			msg: 'Welcome to the API!',
	        connectedDb: db
		}
		return res.json(status);
	});

	return router;
}
