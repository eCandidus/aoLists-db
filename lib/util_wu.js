/**
 *
 *		util_wu.js
 *		aolists
 *
 *      Where Used related calls
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
 *  wuATT - Creates a where used list
 */
aofn.wuATT = function (req, res, wkey, target, wat, wdone) {
    // 
    wdone.push(wkey);

    var query = aofn.queryATTATT(wkey);
    var options = {};
    var extra, descfld;
    if (aofn.config.enableDESC) {
        extra = aofn.queryATTX(aofn.config.db.attach.fields.descpfld, 1);
        descfld = aofn.config.db.attach.fields.descpfld;
    }
    options.fields = aofn.queryATTPARENT(1, aofn.queryATTSTYLE(1, aofn.queryATTX(aofn.config.db.attach.fields.verpfld, 1, extra)));

    aofn.executeDB(req, res, aofn.config.db.attach.db, function (req, res, db) {
        db.collection(aofn.config.db.attach.collection, function (err, collection) {
            collection.ensureIndex(aofn.config.db.attach.fields.parentfld, {
                background: true
            }, function (err, rslts) {
                collection.find(query, options, function (err, cursor) {
                    if (err || !cursor) {
                        aofn.response.errorOut(req, err || 'No cursor', '01');
                    } else {
                        cursor.toArray(function (err, docs) {
                            if (err) {
                                aofn.response.errorOut(req, err, '02');
                            } else {
                                if (docs.length) {
                                    wat.level += docs.length;
                                    docs.forEach(function (doc) {
                                        var pkey = doc[aofn.config.db.attach.fields.parentfld];
                                        if (wdone.indexOf(pkey) != -1) {
                                            wat.level--;
                                        } else {
                                            var litem = pkey.split('#');
                                            var ldb = litem[0];
                                            var lcollection = litem[1];
                                            var lid = litem[2];
                                            if (lcollection == target) {
                                                aofn.response.addValueToArray(req, aofn.queryATTKEY(doc, aofn.config.db.attach.fields.parentfld, aofn.config.db.attach.fields.descpfld, aofn.config.db.attach.fields.verpfld));
                                                wat.level--;
                                            } else {
                                                aofn.wuATT(req, res, pkey, target, wat, wdone);
                                            }
                                        }
                                    });
                                }
                                wat.level--;
                                if (wat.level === 0) {
                                    aofn.response.sendArray(req);
                                }
                            }
                        });
                    }
                });
            });
        });
    });
};