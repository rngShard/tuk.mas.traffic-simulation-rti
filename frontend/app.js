var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
process.title = 'procTitle';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// // uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/libs', express.static(path.join(__dirname, 'node_modules')));

var config = require('./config/config');    // place config file, being ignored via gitignore

/* Model */

// var dataAccess = require('./model/mongoConnection')(config);   // No DB access needed
var masSimulatorConnection = require('./model/masSimulatorConnection')();

/* View */

app.use('/', require('./routes/index')(masSimulatorConnection));

/* Controller */

app.use('/api/', require('./controller/api')(masSimulatorConnection));

/* misc */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler (no stacktraces leaked to user unless in development environment)
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: (app.get('env') === 'development') ? err : {}
  });
});


module.exports = app;
