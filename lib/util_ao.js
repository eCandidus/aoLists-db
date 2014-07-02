/**
 *
 *		util_ao.js
 *		aolists
 *
 *      Aggregate Object related calls
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    app = module.parent.exports.app,
    aofn = module.parent.exports.aofn;

/** 
 * constructAO - Makes an aggregate object from a stack
 */
aofn.constructAO = function (stack, doc, level) {
    if (doc) {
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].pos == level) {
                doc = aofn.mergeAO(doc, stack[i].style, aofn.constructAO(stack, stack[i].doc, i + 1));
            }
        }
    } else {
        doc = {};
        for (var j = 0; j < stack.length; j++) {
            if (!stack[j].pos) {
                doc = stack[j].doc;
                break;
            }
        }
        doc = aofn.constructAO(stack, doc, 1);
    }
    return doc;
};

/**
 * mergeAO - Merges attachments
 */
aofn.mergeAO = function (wdoc, style, ldoc) {
    if (ldoc) {
        if (wdoc) {
            if (!style) {
                style = 'attachment';
            }
            var items = style.split('.');
            var at = wdoc;
            for (var i = 0; i < items.length - 1; i++) {
                var item = items[i];
                if (!at[item]) {
                    at[item] = {};
                }
                at = at[item];
            }
            var litem = items[items.length - 1];
            if (!at[litem]) {
                at[litem] = ldoc;
            } else {
                if (!Array.isArray(at[litem])) {
                    at[litem] = [at[litem]];
                }
                at[litem].push(ldoc);
            }
        } else {
            wdoc = ldoc;
        }
    }
    return wdoc;
};

/**
 *  docATTGet - Retrieves document
 */
aofn.docATTGet = function (req, res, wkey, opts, cb, wstack, wstyle, pos, wat, wdone) {
    var witem = wkey.split('#');
    var wdb = witem[0];
    var wcollection = witem[1];
    var wid = witem[2];

    var options = {};
    if (opts.structureonly) {
        options.fields = aofn.queryID(1, aofn.queryVER(1));
    }
    wat = wat || {
        level: 1
    };
    wdone = wdone || [];
    wdone.push(wkey);

    aofn.executeDB(req, res, wdb, function (req, res, db) {
        db.collection(wcollection, function (err, collection) {
            collection.findOne(aofn.queryID(wid), options, function (err, ldoc) {
                if (err) {
                    aofn.response.errorOut(req, err, 'docATTGetAO 01');
                } else {
                    ldoc = aofn.standardizeIN(req, collection, ldoc);
                    if (opts.showsource) {
                        ldoc['_db'] = wdb;
                        ldoc['_collection'] = wcollection;
                    }
                    wstack.push({
                        'style': wstyle,
                        'doc': ldoc,
                        'pos': pos
                    });

                    wat.level--;
                    if (wat.level === 0) {
                        if (cb) {
                            var wdoc = aofn.constructAO(wstack);
                            cb(wdb, wcollection, wid, wdoc);
                        }
                    }
                }
            });
        });
    }, true);
};

/**
 *  docATTGetAO - Retrieves ao document
 */
aofn.docATTGetAO = function (req, res, wkey, opts, cb, wstack, wstyle, pos, wat, wdone) {
    wstack = wstack || [];
    pos = pos || 0;

    var witem = wkey.split('#');
    var wdb = witem[0];
    var wcollection = witem[1];
    var wid = witem[2];

    var options = {};
    if (opts.structureonly) {
        options.fields = aofn.queryID(1, aofn.queryVER(1));
    }
    wat = wat || {
        level: 1
    };
    wdone = wdone || [];
    wdone.push(wkey);

    aofn.executeDB(req, res, wdb, function (req, res, db) {
        db.collection(wcollection, function (err, collection) {
            collection.findOne(aofn.queryID(wid), options, function (err, ldoc) {
                if (err) {
                    aofn.response.errorOut(req, err, 'docATTGetAO 01');
                } else {
                    ldoc = aofn.standardizeIN(req, collection, ldoc || {});
                    if (opts.showsource) {
                        ldoc['_db'] = wdb;
                        ldoc['_collection'] = wcollection;
                    }

                    aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
                        db.collection(aofn.config.db.attach.collection, function (err, collection) {
                            collection.ensureIndex(aofn.config.db.attach.fields.parentfld, function (err, rslts) {
                                collection.find(aofn.queryATTPARENT(aofn.attachKEY(wdb, wcollection, wid)), {}, function (err, cursor) {
                                    if (err || !cursor) {
                                        aofn.response.errorOut(req, err || 'No cursor', 'docATTGetAO 02');
                                    } else {
                                        var list = [];
                                        cursor.toArray(function (err, docs) {
                                            if (err) {
                                                aofn.response.errorOut(req, err, 'docATTGetAO 03');
                                            } else {
                                                if (docs.length) {
                                                    wat.level += docs.length;
                                                    wstack.push({
                                                        'style': wstyle,
                                                        'doc': ldoc,
                                                        'pos': pos
                                                    });
                                                    pos = wstack.length;
                                                    docs.forEach(function (doc) {
                                                        var item = doc[aofn.config.db.attach.fields.attfld];
                                                        var style = doc[aofn.config.db.attach.fields.stylefld];
                                                        if (!style.length) {
                                                            style = 'attachment';
                                                        }
                                                        if (opts.include) {
                                                            if (opts.include.indexOf(style) == -1) {
                                                                item = null;
                                                                wat.level--;
                                                            }
                                                        }
                                                        if (item && opts.exclude) {
                                                            if (opts.exclude.indexOf(style) != -1) {
                                                                item = null;
                                                                wat.level--;
                                                            }
                                                        }
                                                        if (item) {
                                                            if (wdone.indexOf(item) == -1) {
                                                                if (opts.nosubs) {
                                                                    aofn.docATTGet(req, res, item, opts, cb, wstack, style, pos, wat, wdone);
                                                                } else {
                                                                    aofn.docATTGetAO(req, res, item, opts, cb, wstack, style, pos, wat, wdone);
                                                                }
                                                            } else {
                                                                if (opts.showdups) {
                                                                    aofn.docATTGet(req, res, item, opts, cb, wstack, style, pos, wat, wdone);
                                                                } else {
                                                                    var xitem = item.split('#');
                                                                    var tdoc = {
                                                                        '_id': xitem[2],
                                                                        '_ver': 'duplicate'
                                                                    };
                                                                    if (opts.showsource) {
                                                                        tdoc['_db'] = wdb;
                                                                        tdoc['_collection'] = wcollection;
                                                                    }
                                                                    wstack.push({
                                                                        'style': style,
                                                                        'doc': tdoc,
                                                                        'pos': pos
                                                                    });
                                                                    wat.level--;
                                                                }
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    ldoc = aofn.mergeAO(wdoc, wstyle, ldoc);
                                                    wstack.push({
                                                        'style': wstyle,
                                                        'doc': ldoc,
                                                        'pos': pos
                                                    });
                                                    pos = wstack.length;
                                                }
                                                wat.level--;
                                                if (wat.level === 0) {
                                                    if (cb) {
                                                        var wdoc = aofn.constructAO(wstack);
                                                        cb(wdb, wcollection, wid, wdoc);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            });
                        });
                    }, true);
                }
            });
        });
    }, true);
};