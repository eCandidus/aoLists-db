/**
 *
 *		findone.js
 *		aolists
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var aofn = module.parent.parent.parent.exports.aofn;

exports.send = function (collection, query, options, req, res, db, err) {
    collection.findOne(query, options, function (err, doc) {
        if (err) {
            aofn.response.errorOut(req, err, 'findOne 01');
        } else {
            if (doc) {
                aofn.response.sendResult(req, aofn.standardizeIN(req, collection, doc));
            } else {
                aofn.response.sendResult(req, {});
            }
        }
    });
};