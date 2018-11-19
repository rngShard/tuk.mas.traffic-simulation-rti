var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var Promise = require('promise');
var debug = require('debug')('App');
var f = require('util').format;

module.exports = function(config) {
	var baseUrl = config.database.url + ':' + config.database.port + '/' + config.database.db;
	var user = encodeURIComponent(config.database.username);
	var password = encodeURIComponent(config.database.password);
	var authMechanism = 'DEFAULT';
	var authSource = config.database.authSource;
	this.db = null;

	var url = f('mongodb://%s:%s@%s?authMechanism=%s&authSource=%s', user, password, baseUrl, authMechanism, authSource);
	debug('Connecting to database: ', url);
	
	mongoClient.connect(url, function(err, db) {
  		if(err) {
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

	/* Mongo functionality */

	var findOne = function(coll, q) {
		return new Promise(function(fulfill, reject) {
			this.db.collection(coll).findOne(q, function(err, doc) { err ? reject(err) : fulfill(doc) });
		});
	};
	var find = function(coll, q) {
		return new Promise(function(fulfill, reject) {
			this.db.collection(coll).find(q).toArray(function(err, doc) { err ? reject(err) : fulfill(doc) });
		});
	};
	var insertOne = function(coll, q) {
		return new Promise(function(fulfill, reject) {
			this.db.collection(coll).insertOne(q, function(err, doc) { err ? reject(err) : fulfill(doc) });
		});
	};
	var updateOne = function(coll, q, obj) {
		return new Promise(function(fulfill, reject) {
			this.db.collection(coll).updateOne(q, obj, function(err, doc) { err ? reject(err) : fulfill(doc) });
		});
	};
	var deleteOne = function(coll, q) {
		return new Promise(function(fulfill, reject) {
			this.db.collection(coll).deleteOne(q, function(err, doc) { err ? reject(err) : fulfill(doc) });
		});
	};
	var remove = function(coll, q) {
		return new Promise(function(fulfill, reject) {
			this.db.collection(coll).remove(q, {justOne: false}, function(err, doc) { err ? reject(err) : fulfill(doc) });
		});
	};

	/* dataAccess functionality */

	this.findDocIn = function(coll, docId) { return findOne(coll, {_id: new mongo.ObjectID(docId)}); };
	this.findDocWhere = function(coll, qObj) { return findOne(coll, qObj); };
	this.findAllIn = function(coll, docId) { return find(coll, {}); };
	this.findAllWhere = function(coll, qObj) { return find(coll, qObj); };

	this.insertDocInto = function(coll, obj) { return insertOne(coll, obj); };

	this.replaceDocIn = function(coll, docId, obj) { return updateOne(coll, {_id: new mongo.ObjectID(docId)}, obj); };

	this.removeDocIn = function(coll, docId) { return deleteOne(coll, {_id: new mongo.ObjectID(docId)}); };
	this.removeAllWhere = function(coll, q) { return remove(coll, q); };

	return this;
};

