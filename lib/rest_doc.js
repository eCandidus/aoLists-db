/**
 *
 *		rest_doc.js
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

if (aofn.config.enableATTACH) {
    /**
     *		/:db/:collection/:id/ao
     *
     *		Returns:
     *
     *		The aggregate document whose _id is given
     */
    app.get('/:db/:collection/:id/ao', function (req, res) {
        aofn.debugSTART(req);

        var opts = {};

        opts.showdups = aofn.getQValue(req, 'showdups') == 'y';
        opts.showsource = aofn.getQValue(req, 'showsource') == 'y';
        opts.structureonly = aofn.getQValue(req, 'structureonly') == 'y';
        opts.nosubs = aofn.getQValue(req, 'nosubs') == 'y';
        var wkg = aofn.getQValue(req, 'include');
        if (wkg && wkg.length > 0) {
            opts.include = wkg.split(wkg[0]);
        }
        wkg = aofn.getQValue(req, 'exclude');
        if (wkg && wkg.length > 0) {
            opts.exclude = wkg.split(wkg[0]);
        }

        aofn.authorize(req, res, function (req, res) {
            var query = aofn.queryID(req.params.id);
            var options = {};

            aofn.docATTGetAO(req, res, aofn.attachKEY(req.params.db, req.params.collection, req.params.id), opts, function (db, collection, id, doc) {
                if (doc) {
                    aofn.response.sendResult(req, doc);
                } else {
                    aofn.response.sendResult(req, {});
                }
            });
        });
    });
}

/**
 *		/:db/:collection/:id
 *
 *		Returns:
 *
 *		The document whose _id is given
 */
app.get('/:db/:collection/:id', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        var query = aofn.queryID(req.params.id);
        var options = {};
        var operation = 'findone';

        aofn.executeDB(req, res, req.params.db, function (req, res, db) {
            db.collection(req.params.collection, function (err, collection) {
                require('./operations/' + operation).send(collection, query, options, req, res, db, err);
            });
        });
    });
});

/**
 *		/:db/:collection (POST)
 *
 *		If the document has a _ver an update takes place, otherwise an insert takes place
 *
 *		Returns:
 *
 *		If the operation took place, the _id and new _ver
 */
app.post('/:db/:collection', function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        aofn.buildBODY(req, function (doc) {
            doc = aofn.assureID(doc);
            aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                db.collection(req.params.collection, function (err, collection) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        if (!doc[aofn.config.db.fields.ver]) {
                            doc = aofn.standardizeOUT(req, collection, doc, function (doc) {
                                collection.insert(doc, {
                                    w: aofn.config.db.w || 1,
                                    continueOnError: true
                                }, function (err, fdoc) {
                                    if (err) {
                                        aofn.response.errorOut(req, err, '02');
                                    } else if (!fdoc) {
                                        aofn.response.errorOut(req, 'No document was inserted', '03');
                                    } else {
                                        aofn.response.fromDoc(req, doc);
                                    }
                                });
                            });
                        } else {
                            var spec = aofn.queryID(doc._id, aofn.queryVER(doc[aofn.config.db.fields.ver]));
                            doc = aofn.standardizeOUT(req, collection, doc, function (doc) {
                                collection.update(spec, doc, {
                                    w: aofn.config.db.w || 1
                                }, function (err, count) {
                                    if (err) {
                                        aofn.response.errorOut(req, err, '04');
                                    } else if (count === 0) {
                                        aofn.response.errorOut(req, 'No document was updated', '05');
                                    } else {
                                        aofn.response.fromDoc(req, doc);
                                        if (aofn.config.enableATTACH) {
                                            var queryA = aofn.queryATTATT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
                                            var extraA;
                                            if (aofn.config.enableDESC) {
                                                extraA = aofn.queryXXX(aofn.config.db.attach.fields.desccfld, doc[aofn.config.db.fields.desc]);
                                            }
                                            var setA = aofn.queryXXX(aofn.config.db.attach.fields.vercfld, doc[aofn.config.db.fields.ver], extraA);
                                            var queryP = aofn.queryATTPARENT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
                                            var extraP;
                                            if (aofn.config.enableDESC) {
                                                extraP = aofn.queryXXX(aofn.config.db.attach.fields.descpfld, doc[aofn.config.db.fields.desc]);
                                            }
                                            var setP = aofn.queryXXX(aofn.config.db.attach.fields.verpfld, doc[aofn.config.db.fields.ver], extraP);
                                            aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                                                db.collection(aofn.config.db.attach.collection, function (err, collection) {
                                                    collection.update(queryP, {
                                                        '$set': setP
                                                    }, {}, function (err, count) {
                                                        collection.update(queryA, {
                                                            '$set': setA
                                                        }, {}, function (err, count) {});
                                                    });
                                                });
                                            });
                                        }
                                    }
                                });
                            });
                        }
                    }
                });
            });
        });
    });
});

/**
 *		/:db/:collection/:id
 *
 *		Deletes a document
 */
app.delete('/:db/:collection/:id', function (req, res) {
    aofn.debugSTART(req, 'DELETE');

    aofn.authorize(req, res, function (req, res) {
        aofn.executeDB(req, res, req.params.db, function (req, res, db) {
            db.collection(req.params.collection, function (err, collection) {
                if (err) {
                    aofn.response.errorOut(req, err, '02');
                } else {
                    var spec = aofn.queryID(req.params.id);
                    if (aofn.config.db.w === 0) {
                        collection.remove(spec);
                        aofn.response.fromDoc(req, {
                            '_id': req.params.id
                        });
                    } else {
                        collection.remove(spec, function (err, count) {
                            if (err) {
                                aofn.response.errorOut(req, err, '03');
                            } else if (count === 0) {
                                aofn.response.errorOut(req, 'No document was deleted', '04');
                            } else {
                                aofn.response.fromDoc(req, {
                                    '_id': req.params.id
                                });
                                if (aofn.config.enableATTACH) {
                                    var queryP = aofn.queryATTPARENT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
                                    var queryA = aofn.queryATTATT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
                                    aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                                        db.collection(aofn.config.db.attach.collection, function (err, collection) {
                                            collection.remove(queryP, {}, function (err, doc) {
                                                collection.remove(queryA, {}, function (err, doc) {});
                                            });
                                        });
                                    });
                                }
                            }
                        });
                    }
                }
            });
        });
    });
});