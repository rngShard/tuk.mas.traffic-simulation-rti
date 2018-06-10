var express = require('express');
var router = express.Router();
var debug = require('debug')('App');

module.exports = function(dataAccess) {

	router.get('/', function(req, res, next) {
		return res.send({
			msg: 'Welcome to the API!'
		});
	});

	// router.get('/test', function(req, res, next) {
	// 	dataAccess.findAllIn('test').done(function(docs) {
	// 		dataAccess.findDocIn('test','5b1cf51fbe8f3447eeb1f25e').done(function(doc) {
	// 			dataAccess.insertDocInto('test',{test2:'234'}).done(function(insertStat) {
	// 				dataAccess.replaceDocIn('test','5b1cf51fbe8f3447eeb1f25e',{test:'21'}).done(function(replaceStat) {
	// 					return res.send({
	// 						docs: docs,
	// 						doc: doc,
	// 						insert: insertStat,
	// 						replace: replaceStat
	// 					});
	// 				});
	// 			});
	// 		});
	// 	});
	// });

	return router;
}
