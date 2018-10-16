var express = require('express');
var router = express.Router();
var debug = require('debug')('App');

module.exports = function(masSimulatorConnection) {

	router.get('/', function(req, res, next) {
		return res.send({
			msg: 'Welcome to the API!'
		});
	});

	router.get('/graph', function(req, res, next) {
		let graph = masSimulatorConnection.getGraph();
		return res.send({
			msg: 'Graph retrieved from internal connection to MAS-Simulator.',
			payload: graph
		});
	});

	router.get('/graph/test', function(req, res, next) {
		let graph = masSimulatorConnection.getTestGraph();
		return res.send({
			msg: 'Test Graph retrieved.',
			payload: graph
		});
	});

	// router.get('/test', function(req, res, next) {
	// 	dataAccess.findAllIn('test').done(function(docs) {
	// 		dataAccess.findDocIn('test','5b1cf51fbe8f3447eeb1f25e').done(function(doc) {
	// 			dataAccess.insertDocInto('test',{}).done(function(insertStat) {
	// 				dataAccess.replaceDocIn('test','5b1cf51fbe8f3447eeb1f25e',{test:'21'}).done(function(replaceStat) {
	// 					dataAccess.removeDocIn('test','5b1d6efb2570f82af3c81d22').done(function(removeStat) {
	// 						dataAccess.removeAllWhere('test',{test2: '234'}).done(function(removeStat) {
	// 							return res.send({
	// 								docs: docs,
	// 								doc: doc,
	// 								insert: insertStat,
	// 								replace: replaceStat,
	// 								remove: removeStat
	// 							});
	// 						});
	// 					});
	// 				});
	// 			});
	// 		});
	// 	});
	// });

	return router;
}
