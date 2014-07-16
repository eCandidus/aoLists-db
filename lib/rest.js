/**
 *
 *		rest.js
 *		aolists
 *
 *		2014-06-17  -   Changes to support aolLists client (by Jose E. Gonzalez jr)
 *		2013        -   Copyright (c) 2013 Mariano Fiorentino, Andrea Negro
 *		2010-10-03  -   Created by Tom de Grunt on 2010-10-03 in mongodb-rest
 */
var app = module.parent.exports.app,
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
    aofn = module.parent.exports.aofn;

require('./rest_util');
require('./rest_web');
require('./rest_attach');
require('./rest_users');
require('./rest_subs');
require('./rest_coll');
require('./rest_doc');
require('./rest_db');

/**
 *      /
 *
 *      Returns:
 *
 *      The array list of all databases in return.values
 */
app.get('/', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        aofn.response.makeValuesArray(req);
        aofn.executeDB(req, res, 'admin', function (req, res, db) {
            db.command({
                'listDatabases': 1
            }, function (err, doc) {
                if (err) {
                    aofn.response.errorOut(req, err, 'app.get / 01');
                } else {
                    var dab = doc.databases,
                        len = dab.length;
                    for (var i = 0; i < len; i++) {
                        var namedb = dab[i].name;
                        aofn.response.addValueToArray(req, namedb);
                    }
                    aofn.response.sendArray(req);
                }
            });
        });
    });
});