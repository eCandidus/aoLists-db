/**
 *
 *		keys.js
 *		aolists
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var aofn = module.parent.parent.parent.exports.aofn;

exports.send = function (collection, query, options, req, res, db, err) {
    collection.distinct('_id', {}, options, function (err, cursor) {
        if (err) {
            aofn.response.errorOut(req, err, 'keys 01');
        } else {
            aofn.response.sendCursor(req, cursor);
        }
    });
};