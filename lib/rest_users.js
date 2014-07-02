/**
 *
 *		rest_users.js
 *		aolists
 *
 *		Users related routes
 *
 *		2014-06-17  -   Changes to support aolLists client (by Jose E. Gonzalez jr)
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
 *      /users
 *
 *      Lists the users
 */
app.get('/' + aofn.config.db.users.label, function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        // Only allow if current user is manager
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {
            aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                var query = aofn.userREC(req.params.name);
                db.collection(aofn.config.db.users.collection, function (err, collection) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        collection.distinct(aofn.config.db.users.fields.namefld, {}, {}, function (err, docs) {
                            if (err || !docs) {
                                aofn.response.errorOut(req, err || 'No docs', '02');
                            } else {
                                aofn.response.makeValuesArray(req);
                                docs.forEach(function (doc) {
                                    aofn.response.addValueToArray(req, doc);
                                });
                                aofn.response.sendArray(req);
                            }
                        });
                    }
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '04');
        }
    });
});

/**
 *      /users/:name/:pwd
 *
 *      Adds an user to the user table
 *		If level = manager then the user will be a manager if the current user is a manager
 */
app.get('/' + aofn.config.db.users.label + '/:name/:pwd', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {

        // Only allow if current user is manager or the user itself
        if (aofn.response.workBUFFER(req).security.mgrlevel || aofn.response.workBUFFER(req).security.user === aofn.getQValue(req, 'name')) {
            aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                var level = aofn.getQValue(req, 'level');
                if (!aofn.response.workBUFFER(req).security.mgrlevel && level == aofn.config.db.users.mgrlevel) {
                    level = '';
                }
                var query = aofn.userREC(req.params.name);
                var values = {
                    '$set': aofn.userREC(req.params.name, aofn.hash(req.params.pwd), level)
                };
                var options = {
                    upsert: true
                };
                db.collection(aofn.config.db.users.collection, function (err, collection) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        collection.update(query, values, options, function (err, rslt) {
                            aofn.response.done(req);
                        });
                    }
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '02');
        }
    });
});

/**
 *      /users/:name/delete
 *
 *      Removes an user
 */
app.delete('/' + aofn.config.db.users.label + '/:name', function (req, res) {
    aofn.debugSTART(req, 'DELETE');

    aofn.authorize(req, res, function (req, res) {

        // Only allow if current user is manager
        if (aofn.response.workBUFFER(req).security.mgrlevel) {
            aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                var query = aofn.userREC(req.params.name);
                db.collection(aofn.config.db.users.collection, function (err, collection) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        collection.remove(query, function (err, rslts) {
                            // Remove all subscriptions!
                            if (aofn.config.enableSUBS) {
                                aofn.executeDB(req, res, 'admin', function (req, res, db) {
                                    db.command({
                                        'listDatabases': 1
                                    }, function (err, doc) {
                                        if (err) {
                                            aofn.response.errorOut(req, err, '02');
                                        } else {
                                            var dab = doc.databases,
                                                len = dab.length;
                                            var wat = {
                                                level: dab.length
                                            };
                                            var query = aofn.querySUBS(req.params.name);
                                            var setv = {
                                                '$pull': aofn.querySUBS(req.params.name)
                                            };
                                            for (var i = 0; i < len; i++) {
                                                var namedb = dab[i].name;
                                                aofn.executeDB(req, res, namedb, function (req, res, db) {
                                                    db.collectionNames({
                                                        namesOnly: true
                                                    }, function (err, items) {
                                                        if (!err) {
                                                            wat.level += items.length;
                                                            colls = [];
                                                            for (var i = 0; i < items.length; i++) {
                                                                var name = items[i];
                                                                name = name.substring(name.indexOf('.') + 1);
                                                                if (name != 'startup_log' && name != 'system.indexes') {
                                                                    db.collection(name).update(query, setv, {
                                                                       w: aofn.config.db.w || 1
                                                                    }, function (err, rslt) {
                                                                        wat.level--;
                                                                        if (wat.level === 0) {
                                                                            aofn.response.done(req);
                                                                        }
                                                                    });
                                                                } else {
                                                                    wat.level--;
                                                                    if (wat.level === 0) {
                                                                        aofn.response.done(req);
                                                                    }
                                                                }
                                                            }
                                                            wat.level--;
                                                            if (wat.level === 0) {
                                                                aofn.response.done(req);
                                                            }
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    });
                                });
                            } else {
                                aofn.response.done(req);
                            }
                        });
                    }
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '03');
        }
    });
});