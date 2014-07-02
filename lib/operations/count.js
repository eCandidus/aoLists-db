/**
 *
 *		count.js
 *		aolists
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 *		2013		-	Copyright (c) 2013 Mariano Fiorentino, Andrea Negro
 *		2010-10-03	-	Created by Tom de Grunt on 2010-10-03 in mongodb-rest
 */
var aofn = module.parent.parent.parent.exports.aofn;

exports.send = function (collection, query, options, req, res, db, err) {
    collection.find(query).count(function (err, count) {
        if (err) {
            aofn.response.errorOut(req, err, 'count 01');
        } else {
            aofn.response.sendValue(req, count);
        }
    });
};