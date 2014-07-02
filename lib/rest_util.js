/**
 *
 *		rest_util.js
 *		aolists
 *
 *		Document related routes
 *
 *		2014-06-17  -   Changes to support aolLists client (by Jose E. Gonzalez jr)
 *		2013        -   Copyright (c) 2013 Mariano Fiorentino, Andrea Negro
 *		2010-10-03  -   Created by Tom de Grunt on 2010-10-03 in mongodb-rest
 */
var app = module.parent.parent.exports.app,
    Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    aofn = module.parent.parent.exports.aofn;

/**
 *      /util/hash/:value
 *
 *      Returns:
 *
 *      The hash of the value given
 */
app.get('/' + aofn.config.db.util.label + '/hash/:value', function (req, res) {
    aofn.debugSTART(req);

    aofn.response.init(req, res);
    aofn.response.sendValue(req, aofn.hash(req.params.value));
});