/**
 *
 *		util_parser.js
 *		aolists
 *
 *      URL related calls
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    app = module.parent.exports.app,
    aofn = module.parent.exports.aofn;

/**
 *	getQValue - Returns a value from either the query line or headers
 */
aofn.getQValue = function (req, key1, key2) {
    var value = req.query[key1] || req.header[key1];
    if (!value && key2) {
        value = req.query[key2] || req.header[key2];
    }
    if (!value && req.body) {
        value = req.body[key1];
        if (!value && key2) {
            value = req.body[key2];
        }
    }

    return value;
};