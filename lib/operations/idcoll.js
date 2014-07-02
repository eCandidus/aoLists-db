/**
 *
 *		idcoll.js
 *		aolists
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var aofn = module.parent.parent.parent.exports.aofn;

exports.send = function (collection, query, options, req, res, db, err) {
    collection.find(query, options, function (err, cursor) {
        if (err || !cursor) {
            aofn.response.errorOut(req, err || 'No cursor', 'idcoll 01');
        } else {
            cursor.toArray(function (err, docs) {
                if (err) {
                    aofn.response.errorOut(req, err, 'idcoll 02');
                } else {
                    aofn.response.empty(req);
                    docs.forEach(function (doc) {
                        aofn.response.set(req, doc._id, doc[aofn.config.db.fields.ver]);
                    });
                    aofn.response.done(req);
                }
            });
        }
    });
};