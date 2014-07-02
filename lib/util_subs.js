/**
 *
 *		util_subs.js
 *		aolists
 *
 *      Document related calls
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
 *	querySUBS - Creates an object for a subs value
 */
aofn.querySUBS = function (subs, extra) {
    var ans = {};
    ans[aofn.config.db.fields.subs] = subs;
    if (ans) {
        ans = aofn.mergeRecursive(ans, extra);
    }
    return ans;
};

/**
 *	synchLIST - Returns an array of fields to synch object for a given collection
 */
aofn.synchLIST = function (req, coll, item) {
    var list = [aofn.config.db.users.fields.syncfld, aofn.response.workBUFFER(req).security.uuid, coll];
    if (item) {
        list.push(item);
    }
    return list;
};