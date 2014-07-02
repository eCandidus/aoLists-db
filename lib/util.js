/**
 *
 *		util.js
 *		aolists
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
 *  debugSTART - Displays the info at the start of a function call
 */
aofn.debugSTART = function (req, mthd) {
    if (aofn.config.debug) {
        console.log('Called `' + req.route.path + ' (' + (mthd || 'GET') + ') - ' + JSON.stringify(req.params));
    }
};

/**
 * buildBODY - Retrieves the body as JSON
 */
aofn.buildBODY = function (req, cb) {
    require('raw-body')(req, {
        length: req.headers['content-length'],
        limit: '1mb'
    }, function (err, text) {
        if (err || !text) {
            aofn.response.errorOut(req, 'Missing document', '01');
        } else {
            var doc = null;
            try {
                doc = JSON.parse(text.toString());
            } catch (e) {
                doc = null;
            }

            if (!doc) {
                aofn.response.errorOut(req, 'Malformed document', '02');
            } else {
                if (cb) {
                    cb(doc);
                }
            }
        }
    });
};

/**
 *	formatCSV - Properly formats a CSV item
 */
aofn.formatCSV = function (value) {
    if (!value) {
        value = '';
    }
    value = value.toString();
    if (value.indexOf(' ') !== -1 || value.indexOf('"') !== -1 || value.indexOf(',') !== -1) {
        value = '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
};

/**
 * mergeRecursive - Merge two objects
 * (From StackOverflow: http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically)
 */
aofn.mergeRecursive = function (obj1, obj2) {
    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = aofn.mergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }

    return obj1;
};