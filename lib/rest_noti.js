/**
 *
 *		rest_noti.js
 *		aolists
 *
 *		Notification related routes
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
    aofn = module.parent.parent.exports.aofn,
    socketi = require('socket.io');

if (aofn.config.enableNOTI) {
    /**
     *      /noti/users
     *
     *      Lists the users
     */
    app.get('/' + aofn.config.db.notifications.label + '/' + aofn.config.db.users.label, function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            aofn.response.makeValuesArray(req);
            for (var user in aofn.socket.users) {
                aofn.response.addValueToArray(req, user);
            }
            aofn.response.sendArray(req);
        });
    });

    /**
     *      /noti/add/:user/:msg
     *
     *      Sends a notification
     */
    app.post('/' + aofn.config.db.notifications.label, function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            aofn.buildBODY(req, function (doc) {
                doc.from = aofn.response.workBUFFER(req).security.user;
                aofn.response.done(req);
                aofn.socket.qm(doc);
            });
        });
    });

    /**
     *      /noti/get/:user
     *
     *      Gets all notifications
     */
    app.get('/' + aofn.config.db.notifications.label, function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var name = aofn.response.workBUFFER(req).security.user;
            aofn.response.makeValuesArray(req);
            var query = aofn.queryXXX('to', name);
            aofn.executeDB(req, res, aofn.config.db.notifications.db, function (req, res, db) {
                db.collection(aofn.config.db.notifications.collection, function (err, collection) {
                    if (!err) {
                        collection.find(query, options, function (err, cursor) {
                            if (!err) {
                                cursor.toArray(function (err, docs) {
                                    if (!err) {
                                        docs.forEach(function (msg) {
                                            aofn.response.addValueToArray(msg);
                                            collection.remove(aofn.queryXXX('_id', msg._id), function (err) {});
                                        });
                                    }
                                    aofn.response.sendArray(req);
                                });
                            } else {
                                aofn.response.errorOut(req, err, '01');
                            }
                        });
                    } else {
                        aofn.response.errorOut(req, err, '02');
                    }
                });
            });
        });
    });
}