/**
 *
 *		rest_web.js
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
 *		/users/admin
 *
 *		Web page to administer users
 */
app.get('/' + aofn.config.db.users.label + '/admin', function (req, res) {
    aofn.debugSTART(req);

    res.redirect('./web/index.html');
});

app.get('/' + aofn.config.db.users.label + '/web/:page', function (req, res) {
    aofn.debugSTART(req);

    aofn.response.init(req, res);

    if (req.params.page == aofn.config.db.web.index) {
        aofn.response.workBUFFER(req).security = {};
    }

    if (req.params.page == aofn.config.db.web.index || req.params.page == aofn.config.db.web.css) {
        aofn.response.sendPage(req, req.params.page);
    } else {
        aofn.authorize(req, res, function (req, res) {
            aofn.response.sendPage(req, req.params.page, true);
        }, function (req, res) {
            aofn.response.sendPage(req, aofn.config.db.web.index);
        });
    }
});

app.post('/' + aofn.config.db.users.label + '/web/:page', function (req, res) {
    aofn.debugSTART(req);

    var formidable = require('formidable');
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        req.body = fields;

        if (req.params.page == aofn.config.db.web.index) {
            aofn.response.workBUFFER(req).security = {};
        }

        aofn.authorize(req, res, function (req, res) {
            if (!aofn.response.workBUFFER(req).security.mgrlevel) {
                aofn.response.sendPage(req, aofn.config.db.web.index);
            } else {
                aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                    var xc = aofn.getQValue(req, 'xc');
                    var xu = aofn.getQValue(req, 'xu');
                    var xp = aofn.getQValue(req, 'xp');
                    var xm = aofn.getQValue(req, 'xm');

                    var query = aofn.userREC(xu);

                    if (xc == 'add') {
                        var values = {
                            '$set': aofn.userREC(xu, aofn.hash(xp), xm)
                        };
                        var options = {
                            upsert: true
                        };
                        db.collection(aofn.config.db.users.collection, function (err, collection) {
                            if (!err) {
                                collection.update(query, values, options);
                            }
                        });
                        // 
                        aofn.response.sendPage(req, aofn.config.db.web.add, true);
                    } else if (xc == 'del') {
                        db.collection(aofn.config.db.users.collection, function (err, collection) {
                            if (!err) {
                                collection.remove(query);

                                // Remove all subscriptions!
                                if (aofn.config.enableSUBS) {
                                    aofn.executeDB(req, res, 'admin', function (req, res, db) {
                                        db.command({
                                            'listDatabases': 1
                                        }, function (err, doc) {
                                            if (!err) {
                                                var dab = doc.databases,
                                                    len = dab.length;
                                                for (var i = 0; i < len; i++) {
                                                    var namedb = dab[i].name;
                                                    aofn.executeDB(req, res, namedb, function (req, res, db) {
                                                        db.collectionNames({
                                                            namesOnly: true
                                                        }, function (err, items) {
                                                            if (!err) {
                                                                for (var i = 0; i < items.length; i++) {
                                                                    var name = items[i];
                                                                    name = name.substring(name.indexOf('.') + 1);
                                                                    if (name != 'startup_log' && name != 'system.indexes') {
                                                                        db.collection(name).update(aofn.querySUBS(xu), {
                                                                            '$pull': aofn.querySUBS(xu)
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    });
                                                }
                                            }
                                        });
                                    });
                                }
                            }
                        });
                        // 
                        aofn.response.sendPage(req, aofn.config.db.web.del, true);
                    } else {
                        aofn.response.sendPage(req, aofn.config.db.web.add, true);
                    }
                });
            }
        }, function (req, res) {
            aofn.response.sendPage(req, aofn.config.db.web.index);
        });
    });
});

app.get('/' + aofn.config.db.users.label + '/web/images/:page', function (req, res) {
    aofn.debugSTART(req);

    aofn.response.init(req, res);

    if (/.+\.(jpg)/.test(req.params.page)) {
        aofn.response.sendPage(req, 'images/' + req.params.page, false, 'image');
    } else {
        aofn.response.errOut('???');
    }
});

app.get('/favicon.ico', function (req, res) {
    aofn.debugSTART(req);

    aofn.response.init(req, res);
    aofn.response.sendPage(req, 'images/favicon.ico', false, 'image');
});