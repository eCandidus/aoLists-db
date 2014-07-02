/**
 *
 *		find.js
 *		aolists
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 *		2013		-	Copyright (c) 2013 Mariano Fiorentino, Andrea Negro
 *		2010-10-03	-	Created by Tom de Grunt on 2010-10-03 in mongodb-rest
 */
var aofn = module.parent.parent.parent.exports.aofn;

exports.send = function (collection, query, options, req, res, db, err) {
    collection.find(query, options, function (err, cursor) {
        if (err || !cursor) {
            aofn.response.errorOut(req, err || 'No cursor', 'find 01');
        } else {
            cursor.toArray(function (err, docs) {
                if (err) {
                    aofn.response.errorOut(req, err, 'find 02');
                } else {
                    aofn.response.makeValuesArray(req);
                    if (docs) {
                        docs.forEach(function (doc) {
                            aofn.response.addValueToArray(req, aofn.standardizeIN(req, collection, doc));
                        });
                    }
                    aofn.response.sendArray(req);
                }
            });
        }
    });
};