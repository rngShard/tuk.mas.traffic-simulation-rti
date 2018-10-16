var express = require('express');
var router = express.Router();
var debug = require('debug')('App');

module.exports = function() {

    router.get('/', function(req, res) {
        res.render('index', {
            _title_: 'RTI Traffic Simulation Visualization'
        });
    });

    return router;
}
