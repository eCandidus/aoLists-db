/**
 *
 *		util_att.js
 *		aolists
 *
 *      Attachment related calls
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
 *  documentKEY - Creates a key for a document
 */
aofn.attachKEY = function (db, coll, id) {
    return db + '#' + coll + '#' + id;
};

/**
 *	queryATTPARENT - Creates an object for a parent attach value
 */
aofn.queryATTPARENT = function (key, extra) {
    return aofn.queryXXX(aofn.config.db.attach.fields.parentfld, key, extra);
};

/**
 *	queryATTATT - Creates an object for a attached value
 */
aofn.queryATTATT = function (key, extra) {
    return aofn.queryXXX(aofn.config.db.attach.fields.attfld, key, extra);
};

/**
 *	queryATTSTYLE - Creates an object for a attached version
 */
aofn.queryATTSTYLE = function (style, extra) {
    return aofn.queryXXX(aofn.config.db.attach.fields.stylefld, style, extra);
};

/**
 *	queryATTKEY - Creates an object for an attached key
 */
aofn.queryATTKEY = function (doc, keyfld, descfld, verfld, extra) {
    var ans = {};
    var sections = doc[keyfld].split('#');
    ans['_db'] = sections[0];
    ans['_coll'] = sections[1];
    ans['_id'] = sections[2];
    ans[aofn.config.db.fields.style] = doc[aofn.config.db.attach.fields.stylefld];
    if (verfld) {
        ans[aofn.config.db.fields.ver] = doc[verfld];
    }
    if (aofn.config.enableDESC && descfld) {
        ans[aofn.config.db.fields.desc] = doc[descfld];
    }
    if (extra) {
        ans = aofn.mergeRecursive(ans, extra);
    }
    return ans;
};