/**
 *
 *		rest_coll.js
 *		aolists
 *
 *		Collection related routes
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
 *		/:db/:collection
 *
 *		Returns:
 *
 *		The documents found by the query
 */
app.get('/:db/:collection', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        var query = {};
        var options = {};

        var qp = aofn.getQValue(req, 'q', 'query');
        if (qp) {
            try {
                query = JSON.parse(qp);
            } catch (e) {
                query = null;
                aofn.response.errorOut(req, 'Unable to parse query', '01');
            }
        }

        if (query) {
            aofn.config.db.options.forEach(function (key) {
                var value = aofn.getQValue(req, key);
                if (value) {
                    try {
                        options[key] = JSON.parse(value);
                    } catch (e) {
                        options[key] = value;
                    }
                }
            });

            var operation = aofn.getQValue(req, 'o', 'operation') || 'find';
            operation = operation.toLowerCase();
            if (aofn.config.operations.indexOf(operation) == -1) {
                aofn.response.errorOut(req, 'Invalid operation', '02');
            } else {
                aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                    db.collection(req.params.collection, function (err, collection) {
                        require('./operations/' + operation).send(collection, query, options, req, res, db, err);
                    });
                });
            }
        }
    });
});

/**
 *  /:db/:collection/metadata
 *
 *  Returns
 *
 *  The database metadata
 */
app.get('/:db/:collection/metadata', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {

        var query = aofn.queryID(req.params.db + '.' + req.params.collection);
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
 *  /:db/:collection
 *
 *  Deletes the collection
 */
app.delete('/:db/:collection', function (req, res) {
    aofn.debugSTART(req, 'DELETE');

    aofn.authorize(req, res, function (req, res) {
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {

            var query = aofn.queryID(req.params.db + '.' + req.params.collection);
            var options = {};

            aofn.executeDB(req, res, aofn.config.db.definitions.db, function (req, res, db) {
                db.collection(aofn.config.db.definitions.collection, function (err, collection) {
                    collection.remove(query, function (err, rslt) {
                        aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                            db.collection(aofn.config.db.attach.collection, function (err, collection) {
                                var opts = [];
                                opts.push(aofn.queryATTPARENT(new RegExp(req.params.db + '#' + req.params.collection + '#.+')));
                                opts.push(aofn.queryATTATT(new RegExp(req.params.db + '#' + req.params.collection + '#.+')));
                                var dquery = {
                                    '$or': opts
                                };
                                collection.remove(dquery, function (err, rslt) {
                                    aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                                        db.collection(req.params.collection, function (err, collection) {
                                            collection.drop(function (err, rslt) {
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
 *      /:db/:collection (POST)
 *
 *      Creates a collection, makes indexes and saves the metadata
 */
app.post('/:db/:collection/metadata', function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {
            aofn.buildBODY(req, function (doc) {
                doc._id = req.params.db + '.' + req.params.collection;
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
                                    var dq = {};
                                    dq[aofn.config.db.fields.desc] = 'text';
                                    var idxs = doc.indexes || [];
                                    idxs.push(dq);
                                    aofn.makeIDXS(req, collection, idxs);
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