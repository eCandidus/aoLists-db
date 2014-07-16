/**
 *
 *		util_db.js
 *		aolists
 *
 *      Database related calls
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
 * closeDB - Closes any open database
 */
aofn.closeDB = function (req, keepopen) {
    //
    req.session = req.session || {};
    //
    req.session.openDB = req.session.openDB || {};
    //
    if (!keepopen) {
        // Had one opened?
        for (var db in req.session.openDB) {
            req.session.openDB[db].close(true);
        }
        //
        req.session.openDB = {};
    }
};

/**
 *	executeDB - Opens the database
 */
aofn.executeDB = function (req, res, dbname, cb, keepopen) {
    //
    req.session = req.session || {};
    //
    req.session.openDB = req.session.openDB || {};
    // Is the db in the cache?
    var db = req.session.openDB[dbname];
    // OK, reuse
    if (db) {
        // Call
        if (cb) {
            cb(req, res, db);
        }
    } else {
        // Close any open
        aofn.closeDB(req, keepopen);
        // Create it
        db = new Db(dbname, new Server(aofn.config.db.host || 'localhost', aofn.config.db.port || 27017, {
            'auto_reconnect': true,
            'poolSize': 1
        }), {
            w: aofn.config.db.w
        });
        // Open it!
        db.open(function (err, db) {
            // Handle issues
            if (err || !db) {
                aofn.response.errorOut(req, err, 'executeDB 01');
            } else {
                // Save
                req.session.openDB[dbname] = db;

                if (aofn.config.db.username) {
                    db.authenticate(aofn.config.db.username, aofn.config.db.password, function (err, ares) {
                        if (err) {
                            aofn.response.errorOut(req, err, 'executeDB 02');
                        } else {
                            // Call
                            if (cb) {
                                cb(req, res, db);
                            }
                        }
                    });
                } else {
                    // Call
                    if (cb) {
                        cb(req, res, db);
                    }
                }
            }
        });
    }
};

/**
 * queryID - Create a query object for an _id value
 */
aofn.queryID = function (id, extra) {
    // Default
    var query = {
        '_id': id
    };
    // In case the _id is an ObjectID
    if (ObjectID.isValid(id)) {
        try {
            query = {
                '_id': {
                    '$in': [id, new ObjectID(id)]
                }
            };
        } catch (e) {}
    }
    if (extra) {
        query = aofn.mergeRecursive(query, extra);
    }
    return query;
};

/**
 * assureID - Changes JSON as required by aoLists
 */
aofn.assureID = function (doc) {
    // Make sure doc exists
    doc = doc || {};
    // If we do not have an _id, create one
    if (!doc._id) {
        doc._id = (new ObjectID()).toHexString();
    }
    // If it is an object, make into string
    if (typeof doc._id === 'object') {
        doc._id = doc._id.toHexString();
    }
    // If it is not a string, make into one
    if (typeof doc._id !== 'string') {
        doc._id = doc._id.toString();
    }

    return doc;
};

/**
 *	queryXXX - Creates an object with a given key/value
 */
aofn.queryXXX = function (key, value, extra) {
    var ans = {};
    ans[key] = value;
    if (extra) {
        ans = aofn.mergeRecursive(ans, extra);
    }
    return ans;
};

/**
 *	queryVER - Creates an object for a ver value
 */
aofn.queryVER = function (ver, extra) {
    return aofn.queryXXX(aofn.config.db.fields.ver, ver, extra);
};

/**
 *	nextVER - Updates the revision field
 */
aofn.nextVER = function (req, doc) {
    var rev = doc[aofn.config.db.fields.ver];
    if (!rev) {
        rev = '1';
    } else {
        rev = (1 + parseInt(rev.substring(rev.lastIndexOf('#') + 1), 10)).toString();
    }
    doc[aofn.config.db.fields.ver] = (new Date()).toISOString() + '#' + aofn.response.workBUFFER(req).security.uuid + '#' + rev;

    return doc;
};

/**
 *  makeIDXS - Makes indexes, one at a time
 */
aofn.makeIDXS = function (req, collection, idxs) {
    if (idxs.length) {
        idx = idxs.pop();
        collection.ensureIndex(idx, {
            background: 1
        }, function (err, rslt) {
            aofn.makeIDXS(req, collection, idxs);
        });
    } else {
        aofn.response.done(req);
    }
};

/**
 *  cursorTOARRAY - Loads a cursor into an array
 */
aofn.cursorTOARRAY = function (cursor) {
    var ans = [];
    if (cursor) {
        for (var i = 0; i < cursor.length; i++) {
            ans.push(cursor[i]);
        }
    }
    return ans;
};