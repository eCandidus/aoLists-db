/*/
 **
 *
 *		distinct.js
 *		aolists
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 *		2013		-	Copyright (c) 2013 Mariano Fiorentino, Andrea Negro
 *		2010-10-03	-	Created by Tom de Grunt on 2010-10-03 in mongodb-rest
 */
var aofn = module.parent.parent.parent.exports.aofn;

exports.send = function (collection, query, options, req, res, db, err) {
    collection.distinct(options.fields || '_id', query, options, function (err, docs) {
        if (err || !docs) {
            aofn.response.errorOut(req, err || 'No docs', 'distinct 01');
        } else {
            aofn.response.makeValuesArray(req);
            docs.forEach(function (doc) {
                aofn.response.addValueToArray(req, doc);
            });
            aofn.response.sendArray(req);
        }
    });
};