var express = require('express');
var router  = express.Router();

router.get('/', function(req, res) {
    res.render('index', {
      _title_: 'Boilerplate Bootstrap-NodeJS-Express App',
      users: []
    });
});

module.exports = router;
