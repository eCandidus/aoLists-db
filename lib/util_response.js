/**
 *
 *		util_response.js
 *		aolists
 *
 *      Response related calls
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
 *	response - Manages the return object
 */
aofn.response = {

    // Work object
    workBUFFER: function (req) {
        //
        req.session = req.session || {};
        // Make session
        return req.session.responseBUFFER || {};
    },

    // Initialize
    init: function (req, res) {
        //
        req.session = req.session || {};
        // Add the result object
        req.session.responseBUFFER = {
            'res': res,

            'result': {
                'ok': 1
            },

            'security': {},

            'route': req.route.path,
            'contentType': 'application/json',
            'done': false
        };

        if (req.cookies && req.cookies.security) {
            this.workBUFFER(req).security = JSON.stringify(aofn.decrypt(req.cookies.security, aofn.config.sessionSec));
        }
    },

    // Make an empty object
    empty: function (req) {
        this.workBUFFER(req).result = {};
    },

    // Send result
    done: function (req) {
        var wb = this.workBUFFER(req);
        if (!wb.done) {
            wb.done = true;
            wb.res.cookie('security', aofn.encrypt(JSON.stringify(wb.security), aofn.config.sessionSec));
            if (wb.contentType) {
                wb.res.setHeader('Content-Type', wb.contentType);
            }
            if (wb.contentDisposition) {
                wb.res.setHeader('Content-Disposition', wb.contentDisposition);
            }
            wb.res.send(wb.result);
        }
        aofn.closeDB(req);
    },

    // Set error message
    errorOut: function (req, msg, loc) {
        var wb = this.workBUFFER(req);
        wb.result.ok = 0;

        // Add location 
        msg += ' @@ ' + wb.route;
        // Do we have a location?
        if (loc) {
            msg += ' ' + loc;
        }
        // Set
        wb.result.error = msg;

        if (aofn.config.debug) {
            console.log(wb.result.error);
        }

        this.done(req);
    },

    // Sets a value response
    sendValue: function (req, value) {
        this.workBUFFER(req).result.value = value;

        this.done(req);
    },

    // Sets an object response
    sendResult: function (req, value) {
        this.workBUFFER(req).result = value;

        this.done(req);
    },

    // Set an item
    set: function (req, key, value) {
        this.workBUFFER(req).result[key] = value;
    },

    // Set response
    fromDoc: function (req, doc) {
        var wb = this.workBUFFER(req);
        wb.result._id = doc._id;
        wb.result[aofn.config.db.fields.ver] = doc[aofn.config.db.fields.ver];
        this.done(req);
    },

    // Create a values array
    makeValuesArray: function (req) {
        this.workBUFFER(req).result.value = [];
    },

    // Add a value to the result
    addValueToArray: function (req, value) {
        var wb = this.workBUFFER(req);
        wb.result.value = wb.result.value || [];
        wb.result.value.push(value);
    },

    // Sends the array only
    sendArray: function (req) {
        var wb = this.workBUFFER(req);
        if (!wb.done) {
            wb.done = true;
            if (wb.contentType) {
                wb.res.setHeader('Content-Type', wb.contentType);
            }
            wb.res.send(wb.result.value);
        }
        aofn.closeDB(req);
    },

    // Sends a cursor
    sendCursor: function (req, cursor) {
        this.makeValuesArray(req);
        var docs = aofn.cursorTOARRAY(cursor);
        for (var i = 0; i < docs.length; i++) {
            this.addValueToArray(req, docs[i]);
        }
        this.sendArray(req);
    },

    // Send an HTML page
    sendPage: function (req, page, sendcookie, ctype) {
        var wb = this.workBUFFER(req);
        if (!wb.done) {
            wb.done = true;
            if (sendcookie) {
                wb.res.cookie('security', aofn.encrypt(JSON.stringify(wb.security), aofn.config.sessionSec));
            }
            var type = page.substring(page.lastIndexOf('.') + 1);
            wb.res.writeHead(200, {
                'Content-Type': (ctype || 'text') + '/' + type,
                'Cache-Control': 'max-age=3600'
            });
            require('fs').createReadStream(process.cwd() + '/web/' + page).pipe(wb.res);
        }
        aofn.closeDB(req);
    }
};