var Promise = require('promise');
var debug = require('debug')('App');
var f = require('util').format;

module.exports = function(config, mongoClient) {
	var baseUrl = config.database.url + ':' + config.database.port + '/' + config.database.db;
	var user = encodeURIComponent(config.database.username);
	var password = encodeURIComponent(config.database.password);
	// var authMechanism = 'DEFAULT';
	// var authSource = config.database.authSource;
	this.db = null;

	// var url = f('mongodb://%s:%s@%s?authMechanism=%s&authSource=%s', user, password, baseUrl, authMechanism, authSource);
	var url = f('mongodb://%s:%s@%s', user, password, baseUrl);
	//console.log('Connecting to database: ', url);
	
	mongoClient.connect(url, function(err, db) {
  		if(err) {
  			console.log("Database connection error");
  			debug("Database connection error. Cannot connect to " + baseUrl + "(user" + user + ")");
  			throw err;
  			return null;
  		}
  		debug("Database connected");
  		this.db = db;
	});

	this.getDb = function() {
		return this.db;
	};

	this.createSource = function(source) {
		return new Promise(function(fulfill, reject) {
			db.collection('sources').insertOne(source, function(err, doc) {
				if (err)
					reject(err);
				else
					fulfill(doc);
			});
		});
	};

	// this.createLevel = function(level) {
	// 	return new Promise(function(fulfill, reject) {
	// 		db.collection('levels').insertOne(level, function(err, doc) {
	// 			if(err) {
	// 				reject(err);
	// 			}
	// 			fulfill(doc);
	// 		});
	// 	});
	// };

	// this.getLevelById = function(levelId) {
	// 	return new Promise(function(fulfill, reject) {
	// 		db.collection('levels').findOne({ _id: levelId }, function(err, doc) {
	// 			if(err) {
	// 				reject(err);
	// 			}
	// 			if(doc == null) {
	// 				reject('No document found!'); 
	// 			}
	// 			//console.log("Level got from DB: ", doc);
	// 			fulfill(doc);
	// 		});
	// 	});
	// };

	// this.getAllLevelIds = function() {
	// 	return new Promise(function(fulfill, reject) {
	// 		db.collection('levels').find({}, {'name':1, 'type':1 , 'subtype':1, 'description':1, 'reviewStatus':1}).sort({ _id: 1}).toArray(function(err, doc) {
	// 			if(err) {
	// 				reject(err);
	// 			}
	// 			fulfill(doc);
	// 		});
	// 	});
	// };

	return this;
	
};

