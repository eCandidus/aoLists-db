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
 *  /metadata/set - Sets values in all the user profiles
 */
app.post('/' + aofn.config.db.users.label + '/' + aofn.config.metadata + '/set', function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        // Only allow if current user is manager
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {
            aofn.buildBODY(req, function (doc) {
                valobjs = {};
                for (var key in doc) {
                    valobjs[aofn.config.db.users.metadata.field + '.' + key] = doc[key];
                };
                aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                    var query = {};
                    var values = {
                        '$set': valobjs
                    };
                    db.collection(aofn.config.db.users.collection, function (err, collection) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            collection.update(query, values, { fullResult: true, w: aofn.config.db.w || 1 }, function (err, rslt) {
                                aofn.response.done(req);
                            });
                        }
                    });
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '01');
        }
    });
});

/**
 *  /metadata - Gets the user profile
 */
app.get('/' + aofn.config.db.users.label + '/:user/' + aofn.config.metadata, function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        // Only allow if current user is manager
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {
            aofn.userGET(req, res, req.params.user, function (req, res, user, doc) {
                doc = doc || {};
                aofn.response.sendResult(req, doc[aofn.config.db.users.metadata.field] || {});
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '01');
        }
    });
});

/**
 *  /metadata/set - Sets values in the user profile
 */
app.post('/' + aofn.config.db.users.label + '/:user/' + aofn.config.metadata + '/set', function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        // Only allow if current user is manager
        if (aofn.response.workBUFFER(req).security.islevel == aofn.config.db.users.mgrlevelmgr) {
            aofn.buildBODY(req, function (doc) {
                valobjs = {};
                for (var key in doc) {
                    valobjs[aofn.config.db.users.metadata.field + '.' + key] = doc[key];
                };
                aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                    var query = aofn.userREC(req.params.user);
                    var values = {
                        '$set': valobjs
                    };
                    db.collection(aofn.config.db.users.collection, function (err, collection) {
                        if (err) {
                            aofn.response.errorOut(req, err, '01');
                        } else {
                            collection.update(query, values, { fullResult: true, w: aofn.config.db.w || 1 }, function (err, rslt) {
                                aofn.response.done(req);
                            });
                        }
                    });
                });
            });
        } else {
            aofn.response.errorOut(req, 'Unable to process', '01');
        }
    });
});

/**
 *      /users/:name/:pwd/validate
 *
 *      Validates a login
 */
app.get('/' + aofn.config.db.users.label + '/:name/:pwd/validate', function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {

        aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
            var query = aofn.userREC(req.params.name, aofn.hash(req.params.pwd));
            db.collection(aofn.config.db.users.collection, function (err, collection) {
                if (err) {
                    aofn.response.errorOut(req, err, '01');
                } else {
                    collection.count(query, function (err, count) {
                        if (count == 1) {
                            aofn.userGET(req, res, req.params.name, function (req, res, user, doc) {
                                aofn.response.set(req, 'level', doc.level);
                                aofn.response.done(req);
                            });
                        } else {
                            aofn.response.errorOut(req);
                        }
                    });
                }
            });
        });
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
 *      /users/:name (DELETE)
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
                                aofn.executeDB(req, res, aofn.config.db.definitions.db, function (req, res, db) {
                                    db.collection(aofn.config.db.definitions.collection, function (err, collection) {
                                        collection.distinct('_id', {}, {}, function (err, cursor) {
                                            var setv = {
                                                '$pull': aofn.querySUBS(req.params.name)
                                            };
                                            var ds = [];
                                            if (cursor) {
                                                ds = aofn.cursorTOARRAY(cursor);
                                            }
                                            if (ds.length) {
                                                var wat = {
                                                    level: ds.length
                                                };
                                                ds.forEach(function (doc) {
                                                    var def = doc.split('.');
                                                    var xdb = def[0];
                                                    var xcoll = def[1];
                                                    aofn.executeDB(req, res, xdb, function (req, res, db) {
                                                        db.collection(xcoll).update(query, setv, {
                                                            w: aofn.config.db.w || 1
                                                        }, function (err, rslt) {
                                                            wat.level--;
                                                            if (wat.level === 0) {
                                                                aofn.response.done(req);
                                                            }
                                                        });
                                                    });
                                                });
                                                if (wat.level === 0) {
                                                    aofn.response.done(req);
                                                }
                                            } else {
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
                                            }
                                        });
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

/**
 *  /metadata - Gets the user profile
 */
app.get('/' + aofn.config.metadata, function (req, res) {
    aofn.debugSTART(req);

    aofn.authorize(req, res, function (req, res) {
        aofn.userGET(req, res, aofn.response.workBUFFER(req).security.user, function (req, res, user, doc) {
            aofn.response.sendResult(req, doc[aofn.config.db.users.metadata.field] || {});
        });
    });
});

/**
 *  /metadata/set - Sets values in the user profile
 */
app.post('/' + aofn.config.metadata + '/set', function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        aofn.buildBODY(req, function (doc) {
            valobjs = {};
            for (var key in doc) {
                valobjs[aofn.config.db.users.metadata.field + '.' + key] = doc[key];
            };
            aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                var query = aofn.userREC(aofn.response.workBUFFER(req).security.user);
                var values = {
                    '$set': valobjs
                };
                db.collection(aofn.config.db.users.collection, function (err, collection) {
                    if (err) {
                        aofn.response.errorOut(req, err, '01');
                    } else {
                        collection.update(query, values, {});
                        aofn.response.done(req);
                    }
                });
            });
        });
    });
});

/**
 *  /metadata - Stores the user profile
 */
app.post('/' + aofn.config.metadata, function (req, res) {
    aofn.debugSTART(req, 'POST');

    aofn.authorize(req, res, function (req, res) {
        aofn.buildBODY(req, function (doc) {
            aofn.userPUT(req, res, aofn.response.workBUFFER(req).security.user, aofn.queryXXX(aofn.config.db.users.metadata.field, doc), function (req, res, user, value) {
                aofn.response.done(req);
            });
        });
    });
});