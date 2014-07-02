/**
 *
 *		util_doc.js
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
 *	standardizeIN - Standardize inbound document (from database to client)
 *
 *	1) If the document has a _subs and the user name is in the list, pass back a _subs with a value of the user name
 *	2) Otherwise, remove _subs
 *
 *	3) If the document does not have a _ver, make an initial one and update the database
 */
aofn.standardizeIN = function (req, coll, doc) {
    // No info about subs
    if (aofn.config.enableSUBS) {
        delete doc[aofn.config.db.fields.subs];
    }
    // Make sure we have a version
    if (!doc[aofn.config.db.fields.ver]) {
        doc = aofn.nextVER(req, doc);
        coll.update(aofn.queryID(doc._id), {
            $set: aofn.queryVER(doc[aofn.config.db.fields.ver])
        });
    }
    return doc;
};

/**
 *	standardizeOUT - Standardize outbound document (from client to database)
 *
 *	1) Get the _subs value from the database
 *	2) If the document has a _subs and the value is the user name, add that value to the _subs from the database
 *	3) If the document does not have a _subs value, remove the user name from the _subs from the database
 *	4) Use the updated _subs from the database in the document
 *
 *	5) Update _ver to the next value
 */
aofn.standardizeOUT = function (req, coll, doc, cb) {
    //
    if (aofn.config.enableSUBS) {
        // Get subscriptions from database
        coll.findOne(aofn.queryID(doc._id), {
            fields: aofn.querySUBS(1)
        }, function (err, odoc) {
            var subs = [];
            if (!err && odoc) {
                subs = odoc[aofn.config.db.fields.subs];
            }
            // Save the list
            doc[aofn.config.db.fields.subs] = subs;
            // Update the version
            doc = aofn.nextVER(req, doc);
            // Convert to ObjectID if possible
            var id = doc._id;
            if (ObjectID.isValid(id)) {
                try {
                    doc._id = new ObjectID(id);
                } catch (e) {}
            }
            if (cb) {
                cb(doc);
            }
        });
    } else {
        // Convert to ObjectID if possible
        var id = doc._id;
        if (ObjectID.isValid(id)) {
            try {
                doc._id = new ObjectID(id);
            } catch (e) {}
        }
        if (cb) {
            cb(doc);
        }
    }
};

/**
 *  documentGET - Returns an item from the document
 */
aofn.documentGET = function (doc, items) {
    for (var item in items) {
        if (doc) {
            doc = doc[items[item]];
        }
    }
    return doc;
};

/**
 *  documentPUT - Sets an item in the document
 */
aofn.documentPUT = function (doc, items, value) {
    doc = doc || {};
    for (var item in items) {
        doc = doc[items[item]] = doc[items[item]] || {};
    }
    doc[items[items.length - 1]] = value;
};