/**
 *
 *		util_user.js
 *		aolists
 *
 *      User related calls
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
 *	userNRULE - Standarize username and password
 */
aofn.userNRULE = function (value, ispwd) {
    if (value && aofn.config.db.users.enforceNameRule) {
        value = value.toLowerCase();
        if (!ispwd && !(/^[a-z]\w*$/.test(value))) {
            value = null;
        }
    }
    return value;
};

/**
 *	userLOCAL - Localizes username
 */
aofn.userLOCAL = function (value) {
    if (value) {
        var delim = value.indexOf('@');
        if (delim != -1) {
            value = value.substring(0, delim);
        }
    }
    return value;
};

/**
 *	userGLOBAL - Globalizes username
 */
aofn.userGLOBAL = function (value) {
    if (value) {
        value = aofn.userLOCAL(value) + '@' + aofn.config.aoListsExchange.uuid;
    }
    return value;
};

/**
 *	userSITE - Site from global name
 */
aofn.userSITE = function (value) {
    if (value) {
        var delim = value.indexOf('@');
        if (delim != -1) {
            value = value.substring(delim + 1);
        } else {
            value = null;
        }
    }
    return value;
};

/**
 *	userGET - Gets a user
 */
aofn.userGET = function (req, res, user, cb) {
    aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
        var query = aofn.userREC(user);
        db.collection(aofn.config.db.users.collection, function (err, collection) {
            if (err) {
                aofn.response.errorOut(req, err, 'userGET 01');
            } else {
                collection.findOne(query, function (err, doc) {
                    if (err) {
                        aofn.response.errorOut(req, err, 'userGET 02');
                    } else if (cb) {
                        cb(req, res, user, doc);
                    }
                });
            }
        });
    });
};

/**
 *	userPUT - Gets an items from the user table
 */
aofn.userPUT = function (req, res, user, valobj, cb) {
    aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
        var query = aofn.userREC(user);
        var values = {
            '$set': valobj
        };
        db.collection(aofn.config.db.users.collection, function (err, collection) {
            if (err) {
                aofn.response.errorOut(req, err, 'userPUT 01');
            } else {
                collection.update(query, values, {});
                if (cb) {
                    cb(req, res, user, valobj);
                }
            }
        });
    });
};

/**
 *	userREC - Create a user record
 */
aofn.userREC = function (uname, uhash, level) {
    var query = {};
    if (uname) {
        query[aofn.config.db.users.fields.namefld] = uname;
    }
    if (uhash) {
        query[aofn.config.db.users.fields.pwdfld] = uhash;
    }
    if (level !== undefined) {
        query[aofn.config.db.users.fields.levelfld] = level;
    }

    return query;
};