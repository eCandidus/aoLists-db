/**
 *
 *		rest_attach.js
 *		aolists
 *
 *		Attachment related routes
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
 *	Load these routes only if need to
 */
if (aofn.config.enableATTACH) {
    /**
     *		/:db/:collection/:id/attached
     *
     *		Returns:
     *
     *		The attachments entries attached to the document given
     */
    app.get('/:db/:collection/:id/attached/:style?', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var query = aofn.queryATTPARENT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
            var options = {};
            var extra, descfld;
            if (aofn.config.enableDESC) {
                extra = aofn.queryXXX(aofn.config.db.attach.fields.desccfld, 1);
                descfld = aofn.config.db.attach.fields.desccfld;
            }
            options.fields = aofn.queryATTATT(1, aofn.queryATTSTYLE(1, aofn.queryXXX(aofn.config.db.attach.fields.vercfld, 1, extra)));
            if (req.params.style) {
                query = aofn.queryATTSTYLE(req.params.style, query);
            }

            aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                db.collection(aofn.config.db.attach.collection, function (err, collection) {
                    //collection.ensureIndex(aofn.config.db.attach.fields.parentfld, {
                    //    background: true
                    //}, function (err, rslts) {
                    collection.find(query, options, function (err, cursor) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            cursor.toArray(function (err, docs) {
                                if (err) {
                                    aofn.response.errorOut(req, err, '02');
                                } else {
                                    aofn.response.makeValuesArray(req);
                                    if (docs) {
                                        docs.forEach(function (doc) {
                                            var resLine = aofn.queryATTKEY(doc, aofn.config.db.attach.fields.attfld, descfld, aofn.config.db.attach.fields.vercfld);
                                            aofn.response.addValueToArray(req, resLine);
                                        });
                                    }
                                    aofn.response.sendArray(req);
                                }
                            });
                        }
                    });
                    //});
                });
            });
        });
    });

    /**
     *		/:db/:collection/:id/attachedto
     *
     *		Returns:
     *
     *		The documents the the given document are attached to
     */
    app.get('/:db/:collection/:id/attachedto', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var query = aofn.queryATTATT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
            var options = {};
            var extra, descfld;
            if (aofn.config.enableDESC) {
                extra = aofn.queryXXX(aofn.config.db.attach.fields.descpfld, 1);
                descfld = aofn.config.db.attach.fields.descpfld;
            }
            options.fields = aofn.queryATTPARENT(1, aofn.queryATTSTYLE(1, aofn.queryXXX(aofn.config.db.attach.fields.verpfld, 1, extra)));

            aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                db.collection(aofn.config.db.attach.collection, function (err, collection) {
                    //collection.ensureIndex(aofn.config.db.attach.fields.parentfld, {
                    //    background: true
                    //}, function (err, rslts) {
                    collection.find(query, options, function (err, cursor) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            cursor.toArray(function (err, docs) {
                                if (err) {
                                    aofn.response.errorOut(req, err, '02');
                                } else {
                                    aofn.response.makeValuesArray(req);
                                    if (docs) {
                                        docs.forEach(function (doc) {
                                            var resLine = aofn.queryATTKEY(doc, aofn.config.db.attach.fields.parentfld, descfld, aofn.config.db.attach.fields.verpfld);
                                            aofn.response.addValueToArray(req, resLine);
                                        });
                                    }
                                    aofn.response.sendArray(req);
                                }
                            });
                        }
                    });
                    //});
                });
            });
        });
    });

    /**
     *		/:db/:collection/:id/attach/:db2/:collection2/:id2/:style?
     *
     *		Attaches a document to the given document
     */
    app.get('/:db/:collection/:id/attach/:db2/:collection2/:id2/:style?', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var document = aofn.queryATTPARENT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
            document = aofn.queryATTATT(aofn.attachKEY(req.params.db2, req.params.collection2, req.params.id2), document);
            document = aofn.queryATTSTYLE(req.params.style || '', document);

            aofn.executeDB(req, res, req.params.db2, function (req, res, db) {
                db.collection(req.params.collection2, function (err, collection) {
                    var query = aofn.queryID(req.params.id2);
                    collection.findOne(query, {}, function (err, doc) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            if (doc) {
                                document = aofn.mergeRecursive(document, aofn.queryXXX(aofn.config.db.attach.fields.vercfld, doc[aofn.config.db.fields.ver] || ''));
                                if (aofn.config.enableDESC) {
                                    document = aofn.mergeRecursive(document, aofn.queryXXX(aofn.config.db.attach.fields.desccfld, doc[aofn.config.db.fields.desc] || ''));
                                }
                            }
                            aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                                db.collection(req.params.collection, function (err, collection) {
                                    var query = aofn.queryID(req.params.id);
                                    collection.findOne(query, {}, function (err, doc) {
                                        if (err) {
                                            aofn.response.errorOut(req, err, '01');
                                        } else {
                                            if (doc) {
                                                document = aofn.mergeRecursive(document, aofn.queryXXX(aofn.config.db.attach.fields.verpfld, doc[aofn.config.db.fields.ver] || ''));
                                                if (aofn.config.enableDESC) {
                                                    document = aofn.mergeRecursive(document, aofn.queryXXX(aofn.config.db.attach.fields.descpfld, doc[aofn.config.db.fields.desc] || ''));
                                                }
                                            }
                                            aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                                                db.collection(aofn.config.db.attach.collection, function (err, collection) {
                                                    collection.insert(document, function (err, count) {
                                                        if (err) {
                                                            aofn.response.errorOut(req, err, '02');
                                                        } else if (count === 0) {
                                                            aofn.response.errorOut(req, 'No document was inserted', '03');
                                                        } else {
                                                            aofn.response.done(req);
                                                        }
                                                    });
                                                });
                                            });
                                        }
                                    });
                                });
                            });
                        }
                    });
                });
            });
        });
    });

    /**
     *		/:db/:collection/:id/detach/:db2/:collection2/:id2/:style?
     *
     *		Detaches a document from the given document
     */
    app.get('/:db/:collection/:id/detach/:db2/:collection2/:id2/:style?', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var query = aofn.queryATTPARENT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));
            query = aofn.queryATTATT(aofn.attachKEY(req.params.db2, req.params.collection2, req.params.id2), query);
            query = aofn.queryATTSTYLE(req.params.style || '', query);

            aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                db.collection(aofn.config.db.attach.collection, function (err, collection) {
                    collection.remove(query, {}, function (err, doc) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            aofn.response.done(req);
                        }
                    });
                });
            });
        });
    });

    /**
     *	Load these routes only if need to
     */
    if (aofn.config.enableSUBS) {
        /**
         *		/:db/:collection/:id/attachedsynchlist
         *
         *		Returns:
         *
         *		The documents attached to the docuemnt that have changed between the last synch
         */
        app.get('/:db/:collection/:id/attachedsynchlist', function (req, res) {
            aofn.debugSTART(req);

            aofn.authorize(req, res, function (req, res) {
                var cPrefixF = aofn.synchLIST(req, req.params.collection, 'from');
                var cPrefixT = aofn.synchLIST(req, req.params.collection, 'till');
                aofn.userGET(req, res, aofn.response.workBUFFER(req).security.user, function (req, res, user, doc) {

                    var ufrom = aofn.documentGET(doc, cPrefixF);
                    var uto = aofn.documentGET(doc, cPrefixT);

                    var query = aofn.queryATTPARENT(aofn.attachKEY(req.params.db, req.params.collection, req.params.id));

                    var uClause, dClause, from, to;
                    uClause = aofn.queryATTVER({
                        '$not': new RegExp('.+#' + aofn.response.workBUFFER(req).security.uuid + '#.+')
                    });

                    if (ufrom) {
                        try {
                            from = new Date(ufrom);
                            if (uto) {
                                try {
                                    to = new Date(uto);
                                    dClause = aofn.queryATTVER({
                                        '$gte': from.toISOString(),
                                        '$lt': to.toISOString()
                                    });
                                } catch (e) {
                                    aofn.response.errorOut(req, e, '01');
                                }
                            } else {
                                dClause = aofn.queryATTVER({
                                    '$gte': from.toISOString()
                                });
                            }
                        } catch (e) {
                            aofn.response.errorOut(req, e, '02');
                            return;
                        }
                    } else if (uto) {
                        try {
                            to = new Date(uto);
                            dClause = aofn.queryATTVER({
                                '$lt': to.toISOString()
                            });
                        } catch (e) {
                            aofn.response.errorOut(req, e, '03');
                        }
                    }

                    if (uClause) {
                        if (dClause) {
                            query['$and'] = [uClause, dClause];
                        } else {
                            query = aofn.mergeRecursive(query, uClause);
                        }
                    } else if (dClause) {
                        query = aofn.mergeRecursive(query, dClause);
                    }

                    var options = {};
                    options.fields = aofn.queryATTATT(1, aofn.queryATTSTYLE(1));
                    var descfld;
                    if (aofn.config.enableDESC) {
                        descfld = aofn.config.db.attach.fields.desccfld;
                    }

                    aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                        db.collection(aofn.config.db.attach.collection, function (err, collection) {
                            collection.ensureIndex(aofn.config.db.attach.fields.parentfld, {
                                background: true
                            }, function (err, rslts) {
                                collection.find(query, options, function (err, cursor) {
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
                                                        var resLine = aofn.queryATTKEY(doc, aofn.config.db.attach.fields.attfld, descfld, aofn.config.db.attach.fields.vercfld);
                                                        aofn.response.addValueToArray(req, resLine);
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
            });
        });
    }

    /**
     *		/:db/:collection/:id/whereused/:target
     *
     *		Returns:
     *
     *		The documents the the given document are attached to, that are in the target collection
     */
    app.get('/:db/:collection/:id/whereused/:target', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            aofn.response.makeValuesArray(req);
            var skey = aofn.attachKEY(req.params.db, req.params.collection, req.params.id);
            aofn.wuATT(req, res, skey, req.params.target, {
                level: 1
            }, [skey]);
        });
    });
}