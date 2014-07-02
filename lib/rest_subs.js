/**
 *
 *		rest_subs.js
 *		aolists
 *
 *		Subscriptions related routes
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
if (aofn.config.enableSUBS) {
    /**
     *		/:db/:collection/subscription
     *
     *		Returns:
     *
     *		The documents in the subscription
     */
    app.get('/:db/:collection/subscribed', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var query = aofn.querySUBS(aofn.response.workBUFFER(req).security.user);
            var options = {};
            options.fields = aofn.queryVER(1, {
                '_id': 1
            });

            var operation = 'idcoll';

            aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                db.collection(req.params.collection, function (err, collection) {
                    collection.ensureIndex(aofn.config.db.fields.subs, {
                        background: true
                    }, function (err, rslts) {
                        require('./operations/' + operation).send(collection, query, options, req, res, db, err);
                    });
                });
            });
        });
    });

    /**
     *		/:db/:collection/changes/:from?/:to?
     *
     *		Returns:
     *
     *		The documents in the subscription that have changed
     */
    app.get('/:db/:collection/changes/:from?/:to?', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {

            var query = aofn.querySUBS(aofn.response.workBUFFER(req).security.user);

            var uClause, dClause, from, to;
            if (aofn.getQValue(req, 'option') == 'other') {
                uClause = aofn.queryVER({
                    '$not': new RegExp('.+#' + aofn.response.workBUFFER(req).security.uuid + '#.+')
                });
            } else if (aofn.getQValue(req, 'option') == 'me') {
                uClause = aofn.queryVER(new RegExp('.+#' + aofn.response.workBUFFER(req).security.uuid + '#.+'));
            }

            if (req.params.from) {
                try {
                    from = new Date(req.params.from);
                    if (req.params.to) {
                        try {
                            to = new Date(req.params.to);
                            dClause = aofn.queryVER({
                                '$gte': from.toISOString(),
                                '$lt': to.toISOString()
                            });
                        } catch (e) {
                            aofn.response.errorOut(req, e, '01');
                        }
                    } else {
                        dClause = aofn.queryVER({
                            '$gte': from.toISOString()
                        });
                    }
                } catch (e) {
                    aofn.response.errorOut(req, e, '02');
                    return;
                }
            } else if (req.params.to) {
                try {
                    to = new Date(req.params.to);
                    dClause = aofn.queryVER({
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
            options.fields = aofn.queryVER(1, {
                '_id': 1
            });

            var operation = 'idcoll';

            aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                db.collection.ensureIndex(aofn.config.db.fields.subs, {
                    background: true
                }, function (err, rslts) {
                    db.collection(req.params.collection, function (err, collection) {
                        require('./operations/' + operation).send(collection, query, options, req, res, db, err);
                    });
                });
            });
        });
    });


    /**
     *		/:db/:collection/lastsynch
     *
     *		Returns the date/time that the last synch took place
     */
    app.get('/:db/:collection/lastsynch', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var cPrefix = aofn.synchLIST(req, req.params.collection, 'from');
            aofn.userGET(req, res, aofn.response.workBUFFER(req).security.user, function (req, res, user, doc) {
                aofn.response.sendValue(req, aofn.documentGET(doc, cPrefix));
            });
        });
    });
    /**
     *		/:db/:collection/startsynch
     *
     *		Starts a synch transaction
     */
    app.get('/:db/:collection/startsynch', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var cPrefix = aofn.synchLIST(req, req.params.collection, 'till');

            var setList = {};
            setList[cPrefix.join('.')] = (new Date()).toISOString();
            aofn.userPUT(req, res, aofn.response.workBUFFER(req).security.user, setList);
            aofn.response.done(req);
        });
    });

    /**
     *		/:db/:collection/rollbacksynch
     *
     *		Rollbacks the synch as a failure
     */
    app.get('/:db/:collection/rollbacksynch', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var cPrefix = aofn.synchLIST(req, req.params.collection, 'till');

            var setList = {};
            setList[cPrefix.join('.')] = null;
            aofn.userPUT(req, res, aofn.response.workBUFFER(req).security.user, setList);
            aofn.response.done(req);
        });
    });

    /**
     *		/:db/:collection/commitsynch
     *
     *		Commits synch as success
     */
    app.get('/:db/:collection/commitsynch', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var cPrefixF = aofn.synchLIST(req, req.params.collection, 'from');
            var cPrefixT = aofn.synchLIST(req, req.params.collection, 'till');

            aofn.userGET(req, res, aofn.response.workBUFFER(req).security.user, function (req, res, user, doc) {
                var till = aofn.documentGET(doc, cPrefixT);
                if (till) {
                    var setList = {};
                    setList[cPrefixT.join('.')] = null;
                    setList[cPrefixF.join('.')] = till;
                    aofn.userPUT(req, res, aofn.response.workBUFFER(req).security.user, setList);
                }
                aofn.response.done(req);
            });
        });
    });

    /**
     *		/:db/:collection/synclist
     *
     *		Returns:
     *
     *		The documents in the subscription that have changed between the last synch
     */
    app.get('/:db/:collection/synchlist', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            var cPrefixF = aofn.synchLIST(req, req.params.collection, 'from');
            var cPrefixT = aofn.synchLIST(req, req.params.collection, 'till');
            aofn.userGET(req, res, aofn.response.workBUFFER(req).security.user, function (req, res, user, doc) {

                var ufrom = aofn.documentGET(doc, cPrefixF);
                var uto = aofn.documentGET(doc, cPrefixT);

                var query = aofn.querySUBS(aofn.response.workBUFFER(req).security.user);

                var uClause, dClause, from, to;
                uClause = aofn.queryVER({
                    '$not': new RegExp('.+#' + aofn.response.workBUFFER(req).security.uuid + '#.+')
                });

                if (ufrom) {
                    try {
                        from = new Date(ufrom);
                        if (uto) {
                            try {
                                to = new Date(uto);
                                dClause = aofn.queryVER({
                                    '$gte': from.toISOString(),
                                    '$lt': to.toISOString()
                                });
                            } catch (e) {
                                aofn.response.errorOut(req, e, '01');
                            }
                        } else {
                            dClause = aofn.queryVER({
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
                        dClause = aofn.queryVER({
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
                options.fields = aofn.queryVER(1, {
                    '_id': 1
                });

                var operation = 'idcoll';

                aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                    db.collection(req.params.collection, function (err, collection) {
                        require('./operations/' + operation).send(collection, query, options, req, res, db, err);
                    });
                });
            });
        });
    });

    /**
     *		/:db/:collection/:id/subscribe
     *
     *		Returns:
     *
     *		Subscribe to the document whose _id is given
     */
    app.get('/:db/:collection/:id/subscribe', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                var query = aofn.queryID(req.params.id);
                var update = {
                    '$addToSet': aofn.querySUBS(aofn.response.workBUFFER(req).security.user)
                };
                db.collection(req.params.collection).update(query, update, function (err, result) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        aofn.response.fromDoc(req, {
                            '_id': req.params.id
                        });
                    }
                });
            });
        });
    });

    /**
     *		/:db/:collection/:id/unsubscribe
     *
     *		Returns:
     *
     *		Unsubscribe to the document whose _id is given
     */
    app.get('/:db/:collection/:id/unsubscribe', function (req, res) {
        aofn.debugSTART(req);

        aofn.authorize(req, res, function (req, res) {
            aofn.executeDB(req, res, req.params.db, function (req, res, db) {
                var query = aofn.queryID(req.params.id);
                var update = {
                    '$pull': aofn.querySUBS(aofn.response.workBUFFER(req).security.user)
                };
                db.collection(req.params.collection).update(query, update, function (err, result) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        aofn.response.fromDoc(req, {
                            '_id': req.params.id
                        });
                    }
                });
            });
        });
    });
}