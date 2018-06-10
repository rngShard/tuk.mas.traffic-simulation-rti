var express = require('express');
var router = express.Router();
var debug = require('debug')('App');

module.exports = function(dataAccess) {

	router.get('/', function(req, res, next) {
		return res.send({
			msg: 'Welcome to the API!'
		});
	});

	router.get('/test', function(req, res, next) {
		dataAccess.testCount().done(function(count) {
			dataAccess.testFind().done(function(doc) {
				return res.send({
					count: count,
					foundOne: doc
				});
			}, function(err) {
				console.log(err);
				return res.status(500).send({ msg: err });
			});
		});
	});

	router.post('/test', function(req, res, next) {
		dataAccess.testInsertOne(req.body).done(function() {
			return res.send({
				msg: 'Inserted into test successfully'
			});
		});
	});

	return router;
}
