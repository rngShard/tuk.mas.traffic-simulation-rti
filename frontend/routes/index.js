var express = require('express');
var router = express.Router();
var debug = require('debug')('App');

module.exports = function(masSimulatorConnection) {

    router.get('/', function(req, res) {
        res.render('index', {
            _title_: 'RTI Traffic Simulation Visualization',
            graphTitles: masSimulatorConnection.getAllGraphTitles(),
            logInfos: masSimulatorConnection.getLogInfos()
        });
    });

    return router;
}
