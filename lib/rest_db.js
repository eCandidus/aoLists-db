/**
 *
 *		rest_db.js
 *		aolists
 *
 *		Database related routes
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
 *  /allmetadata
 *
 *  Returns
 *
 *  The list of collections that have metadata
 */
app.get('/all' + aofn.config.metadata, function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        aofn.executeDB(req, res, aofn.config.db.definitions.db, function (req, res, db) {
            db.collection(aofn.config.db.definitions.collection, function (err, collection) {
                var desc = aofn.queryXXX(aofn.config.db.fields.desc, 1);
                collection.find({}, { sort: desc }, function (err, cursor) {
                    if (err || !cursor) {
                        aofn.response.errorOut(req, err || 'No cursor', '01');
                    } else {
                        cursor.toArray(function (err, docs) {
                            if (err) {
                                aofn.response.errorOut(req, err, '02');
                            } else {
                                aofn.response.makeValuesArray(req);
                                if (docs) {
                                    docs.forEach(function (doc) {
                                        aofn.response.addValueToArray(req, aofn.standardizeIN(req, collection, doc));
                                    });
                                }
                                aofn.response.sendArray(req);
                            }
                        });
                    }
                });
            });
        });
    });
});

/**
 *      /:db
 *
 *      Returns:
 *
 *      The array list of all collections in return.values
 */
app.get('/:db', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        aofn.response.makeValuesArray(req);

        aofn.executeDB(req, res, req.params.db, function (req, res, db) {
            db.collectionNames({
                namesOnly: true
            }, function (err, items) {
                if (err) {
                    aofn.response.errorOut(req, err, '01');
                } else {
                    for (var i = 0; i < items.length; i++) {
                        var name = items[i];
                        name = name.substring(name.indexOf('.') + 1);
                        if (name != 'startup_log' && name != 'system.indexes') {
                            aofn.response.addValueToArray(req, name);
                        }
                    }
                    aofn.response.sendArray(req);
                }
            });
        });
    });
});

/**
 *  /:db/metadata
 *
 *  Returns
 *
 *  The database metadata
 */
app.get('/:db/' + aofn.config.metadata, function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {

        var query = aofn.queryID(req.params.db);
        var options = {};

        aofn.executeDB(req, res, aofn.config.db.definitions.db, function (req, res, db) {
            db.collection(aofn.config.db.definitions.collection, function (err, collection) {
                collection.findOne(query, options, function (err, doc) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        if (doc) {
                            aofn.response.sendResult(req, doc);
                        } else {
                            aofn.response.sendResult(req, {});
                        }
                    }
                });
            });
        });
    });
});

/**
 *  /:db/delete
 *
 *  Deletes the database
 */
app.delete('/:db', function (req, res) {
    aofn.debugSTART(req, 'DELETE');

    aofn.authorize(req, res, function (req, res) {
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {

            var query = aofn.queryID(req.params.db);
            var options = {};

            aofn.executeDB(req, res, aofn.config.db.definitions.db, function (req, res, db) {
                db.collection(aofn.config.db.definitions.collection, function (err, collection) {
                    collection.remove(query, function (err, rslt) {
                        aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                            db.dropDatabase(function (err, rslt) {
                                if (err) {
                                    aofn.response.errorOut(req, err, '01');
                                } else if (rslt) {
                                    aofn.response.done(req);
                                } else {
                                    aofn.response.errorOut(req, 'Unable to delete', '02');
                                }
                            });
                        });
                    });
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '03');
        }
    });
});

/**
 *      /:db (POST)
 *
 *      Creates a database and saves the metadata
 */
app.post('/:db/' + aofn.config.metadata, function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {
            aofn.buildBODY(req, function (doc) {
                doc._id = req.params.db;
                aofn.executeDB(req, res, aofn.config.db.definitions.db, function (req, res, db) {
                    db.collection(aofn.config.db.definitions.collection, function (err, collection) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            collection.update(aofn.queryID(doc._id), doc, {
                                w: aofn.config.db.w || 1,
                                upsert: true
                            }, function (err, count) {
                                if (err) {
                                    aofn.response.errorOut(req, err, '02');
                                } else if (count === 0) {
                                    aofn.response.errorOut(req, 'No document was updated', '03');
                                } else {
                                    aofn.response.done(req);
                                }
                            });
                        }
                    });
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '04');
        }
    });
});