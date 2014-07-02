/**
 *
 *		util_auth.js
 *		aolists
 *
 *      Authorization related calls
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
 *  customAUTH - Custom authentication
 */
aofn.customAUTH = function (req, res, username, password, endpoint) {
    // Default
    var settings;

    //// If you have your own, first setup the return
    //var settings = {
    //    user: username,
    //    endpoint: endpoint,
    //    level: null,
    //    valid: false
    //};
    //// Now validate and set the missing values
    //settings.level = 'user' // Set to aof.config.db.users.mgrlevel for a manager
    //settings.valid = false // Set to true if the login is valid

    // Returning null tells system to use default authentication
    return settings;
};

/**
 *	authorize - Validates call
 */
aofn.authorize = function (req, res, cbok, cbfail) {
    // Make the response
    aofn.response.init(req, res);
    // Parse authorization
    var auth = req.headers.authorization;
    var authname, authpwd;
    if (auth) {
        if (/Basic .+/.test(auth)) {
            auth = new Buffer(auth.substring(6), 'base64').toString('ascii').split(':');
            if (auth.length == 2) {
                authname = auth[0];
                authpwd = auth[1];
            }
        }
    }
    // Get passed values
    var username = authname || aofn.getQValue(req, 'u', 'username');
    var password = authpwd || aofn.getQValue(req, 'p', 'password');
    var endpoint = aofn.getQValue(req, 'e', 'endpoint');
    // If the user provides user, validate
    if (username) {
        // Empty cache
        aofn.response.workBUFFER(req).security = {};
    }
    // Do we have a user?
    if (!aofn.response.workBUFFER(req).security.user) {
        // Must have something
        if (username) {
            // Call custom
            aofn.response.workBUFFER(req).security = aofn.customAUTH(req, res, username, password, endpoint);
            // Check
            if (aofn.response.workBUFFER(req).security) {
                // Valid?
                if (aofn.response.workBUFFER(req).security.valid) {
                    // We get here for custom auth
                    var wb = aofn.response.workBUFFER(req);
                    wb.uuid = aofn.hash(wb.user + (wb.endpoint || ''));
                    wb.mgrlevel = wb.level == aof.config.db.users.mgrlevel;
                    // Call
                    if (cbok) {
                        cbok(req, res);
                    }
                } else {
                    aofn.response.errorOut(req, 'Who are you?', 'authorize 00');
                }
            } else {
                // Check local ( note that if you do not have a password defined in aofn.config.json, one is not needed - BAD! )
                if (username === aofn.config.login.username && (!aofn.config.login.password || aofn.hash(password) === aofn.config.login.password)) {
                    aofn.response.workBUFFER(req).security = {
                        user: username,
                        endpoint: endpoint,
                        uuid: aofn.hash(username + (endpoint || '')),
                        level: aofn.config.db.users.mgrlevel,
                        mgrlevel: true
                    };
                    // Call
                    if (cbok) {
                        cbok(req, res);
                    }
                } else {
                    aofn.executeDB(req, res, aofn.config.db.users.db, function (req, res, db) {
                        db.collection(aofn.config.db.users.collection, function (err, collection) {
                            if (err) {
                                aofn.response.errorOut(req, err, 'authorize 01');
                            } else {
                                collection.findOne(aofn.userREC(username), function (err, user) {
                                    if (err) {
                                        aofn.response.errorOut(req, err, 'authorize 02');
                                    } else if (user && password && user[aofn.config.db.users.fields.pwdfld] === aofn.hash(password)) {
                                        aofn.response.workBUFFER(req).security = {
                                            user: username,
                                            endpoint: endpoint,
                                            uuid: aofn.hash(username + (endpoint || '')),
                                            level: user[aofn.config.db.users.fields.levelfld],
                                            mgrlevel: user[aofn.config.db.users.fields.levelfld] == aofn.config.db.users.mgrlevel
                                        };
                                        // Call
                                        if (cbok) {
                                            cbok(req, res);
                                        }
                                    } else {
                                        if (cbfail) {
                                            cbfail(req, res);
                                        } else {
                                            aofn.response.errorOut(req, 'Credentials failed', 'authorize 03');
                                        }
                                    }
                                });
                            }
                        });
                    });
                }
            }
        } else {
            if (cbfail) {
                cbfail(req, res);
            } else {
                aofn.response.errorOut(req, 'Who are you?', 'authorize 04');
            }
        }
    } else if (cbok) {
        cbok(req, res);
    }
};