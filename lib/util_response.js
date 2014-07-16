/**
 *
 *		util_response.js
 *		aolists
 *
 *      Response related calls
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var app = module.parent.exports.app,
    aofn = module.parent.exports.aofn,
    fs = require('fs');

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
    },

    // Set error message
    errorOut: function (req, msg) {
        var wb = this.workBUFFER(req);
        wb.result.ok = 0;

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

    // Sets a data response (the default response)
    sendData: function (req, value) {
        this.workBUFFER(req).result.data = value;

        this.done(req);
    },

    // Sets an object response
    sendResult: function (req, value) {
        this.workBUFFER(req).result = value;

        this.done(req);
    },

    // Set an item
    set: function (req, key, value) {
        if (typeof key == 'object') {
            this.workBUFFER(req).result = aofn.mergeRecursive(this.workBUFFER(req).result, key);
        } else {
            this.workBUFFER(req).result[key] = value;
        }
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

    // Send a page
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
            var path = process.cwd() + '/public' + page;
            if (fs.existsSync(path)) {
                fs.createReadStream(path).pipe(wb.res);
            } else {
                wb.res.end();
            }
        }
    },

    // Send a page content
    sendPageContent: function (req, page, content, sendcookie, ctype) {
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
            wb.res.end(content);
        }
    },

    // Send a page
    sendDownload: function (req, page, sendcookie, ctype) {
        var wb = this.workBUFFER(req);
        if (!wb.done) {
            wb.done = true;
            if (sendcookie) {
                wb.res.cookie('security', aofn.encrypt(JSON.stringify(wb.security), aofn.config.sessionSec));
            }
            var type = page.substring(page.lastIndexOf('.') + 1);
            wb.res.writeHead(200, {
                'Content-Type': (ctype || 'application') + '/' + type,
                'Cache-Control': 'max-age=3600',
                'Content-Disposition': 'attachment; filename="' + page + '"'
            });
            var path = process.cwd() + '/public' + page;
            if (fs.existsSync(path)) {
                fs.createReadStream(path).pipe(wb.res);
            }
        }
    },

    // Send a page content
    sendDownloadContent: function (req, page, content, sendcookie, ctype) {
        var wb = this.workBUFFER(req);
        if (!wb.done) {
            wb.done = true;
            if (sendcookie) {
                wb.res.cookie('security', aofn.encrypt(JSON.stringify(wb.security), aofn.config.sessionSec));
            }
            var type = page.substring(page.lastIndexOf('.') + 1);
            wb.res.writeHead(200, {
                'Content-Type': (ctype || 'application') + '/' + type,
                'Cache-Control': 'max-age=3600',
                'Content-Disposition': 'attachment; filename="' + page + '"'
            });
            wb.res.end(content);
        }
    },

    // Setup for service call
    setSvc: function (req, doc) {
        var wb = this.workBUFFER(req);
        wb.result.id = doc.id || 0;
    },

    // Creates a dataset response
    openDataset: function (req, params, cols) {
        var wb = this.workBUFFER(req);
        // Pass back the parameters
        wb.result = params;
        // Create the dataset
        wb.result.dataset = {
            results: 0, // Number of rows in result set
            rows: [], // The result set
            metaData: {
                totalProperty: 'results',
                root: 'rows',
                id: cols[0],
                fields: cols
            }
        };
    },

    // Writes to the dataset
    addDataset: function (req, data) {
        var wb = this.workBUFFER(req);
        // Row object
        var row = {};
        // Make the row
        for (var i = 0; i < wb.result.dataset.metaData.fields.length; i++) {
            row[wb.result.dataset.metaData.fields[i]] = data[i];
        }
        // Add the row
        wb.result.dataset.rows.push(row);
        // Increment counter
        wb.result.dataset.results++;
    }
};