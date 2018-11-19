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
	router.get('/graph/all', function(req, res) {
		let graphs = masSimulatorConnection.getAllGraphs();
		return res.send({
			msg: 'Graphs retrieved from internal connection to MAS-Simulator.',
			payload: graphs
		});
	});
	router.get('/graph/allTitles', function(req, res) {
		return res.send({
			msg: 'Titles of all graphs in masSImulatorConnection.',
			payload: masSimulatorConnection.getAllGraphTitles()
		});
	});
	router.get('/graph/whichActive', function(req, res) {
		return res.send({
			msg: 'Retrieving which graph set to active.',
			payload: {
				graph: masSimulatorConnection.getActiveGraph()
			}
		});
	});
	router.put('/graph/setActive/:title', function(req, res) {
		if (!masSimulatorConnection.getAllGraphTitles().includes(req.params.title)) {
			return res.send({msg:'Invalid title for active graph.'});
		} else {
			masSimulatorConnection.setActiveGraph(req.params.title);
			return res.send({
				msg: "New graph set active."
			});
		}
	});

	router.get('/logs', function(req, res) {
		return res.send({
			msg: 'Retrieving accumulated logs from simulatorConnection',
			payload: masSimulatorConnection.getLogs()
		});
	});
	router.get('/logs/info', function(req, res) {
		return res.send({
			msg: 'Retrieving accumulated logs infos from simulatorConnection',
			payload: masSimulatorConnection.getLogInfos()
		});
	});
	router.get('/logs/:id', function(req, res) {
		return res.send({
			msg: `Getting associatd logs for sim-run <${req.params.id}`,
			payload: masSimulatorConnection.getSimulationLogs(req.params.id)
		});
	});

	return router;
}
