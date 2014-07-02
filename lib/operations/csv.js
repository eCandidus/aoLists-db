/**
 *
 *		csv.js
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
            aofn.response.errorOut(req, err || 'No cursor', 'csv 01');
        } else {
            cursor.toArray(function (err, docs) {
                if (err) {
                    aofn.response.errorOut(req, err, 'csv 02');
                } else {
                    var result = [];
                    if (docs && docs.length > 0) {
                        var keys = Object.keys(docs[0]);
                        var serv = [];
                        for (a in keys) {
                            serv.push(aofn.formatCSV(keys[a]));
                        }
                        result.push(serv.join(','));
                        docs.forEach(function (doc) {
                            serv = [];
                            for (a in keys) {
                                serv.push(aofn.formatCSV(doc[keys[a]]));
                            }
                            result.push(serv.join(','));
                        });
                    }
                    var wb = aofn.response.workBUFFER(req);
                    wb.result = result.join('\n');
                    wb.contentType = 'application/vnd.openxmlformats';
                    wb.contentDisposition = 'attachment; filename="aoLists.csv"';
                    aofn.response.done(req);
                }
            });
        }
    });
};