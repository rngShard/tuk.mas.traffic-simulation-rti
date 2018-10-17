var express = require('express');
var router = express.Router();
var debug = require('debug')('App');

module.exports = function(masSimulatorConnection) {

	router.get('/', function(req, res, next) {
		return res.send({
			msg: 'Welcome to the API!'
		});
	});

	router.get('/graph', function(req, res) {
		let graph = masSimulatorConnection.getGraph();
		return res.send({
			msg: 'Graph retrieved from internal connection to MAS-Simulator.',
			payload: graph
		});
	});
	router.get('/graph/allTitles', function(req, res) {
		return res.send({
			msg: 'Titles of all graphs in masSImulatorConnection.',
			payload: masSimulatorConnection.getAllGraphTitles()
		});
	});
	router.put('/graph/setActive/:idx', function(req, res) {
		let idx = parseInt(req.params.idx);
		if (isNaN(idx)) {
			return res.send({msg:'Invalid active id, must be an integer'});
		} else if (idx < 0 || idx >= masSimulatorConnection.graphs.length) {
			return res.send({msg:'Invalid integer value, must be in range of lenght of graphs-array.'});
		} else {
			masSimulatorConnection.setActiveGraph(req.params.idx);
			return res.send({msg:'New activeGraph set.', newActive:idx});
		}
	});

	return router;
}
