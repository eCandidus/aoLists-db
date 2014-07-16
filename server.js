/**
 *
 *		server.js
 *		aolists-db
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 *		2013		-	Copyright (c) 2013 Mariano Fiorentino, Andrea Negro - AMID
 *		2010-10-03	-	Created by Tom de Grunt on 2010-10-03 in mongodb-rest
 *
 *		aoLists is a project that uses MongoDB as its shared storage space, but
 *		requires true UUID for the _id value as it runs on a disconnected multi-user
 *		mode.
 */

/**
 *  Make room for our utilities
 */
var aofn = {};
module.exports.aofn = aofn;
require('./lib/util');

var fs = require('fs'),
    cluster = require('cluster');

var config = {
    'debug': false, // turn debug messages on/off

    'login': {
        'username': 'admin', // admin user name
        'hash': null // hash of password, if null no password required (BAD!)
    },

    'server': {
        'port': 42324, // port to use
        'maxupload': '4MB', // maximum size of an upload
        'ssl': {
            'cert': null, // file name in the cwd that holds the certificate PEM file
            'key': null // file name in the cwd that holds the private key PEM file
        }
    },

    'sessionSec': 'mysecretgoeshere', // key to encode session with

    'enableDESC': true, // enable description support
    'enableSUBS': true, // enable subscription support
    'enableATTACH': true, // enable attachment support

    'operations': ['count', 'csv', 'distinct', 'find', 'findone', 'idcoll', 'keys'], // Valid operations

    'metadata': 'metadata', // name of the metadata

    'db': {
        'host': 'localhost', // host address for MongoDB server
        'port': 27017, // port
        'w': 0, // write acknowledgement (0 = none, >0 = # servers, 'majority' = the majority)
        'options': ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'],
        // options supported
        'fields': {
            'ver': '_ver', // version field
            'subs': '_subs', // subscription field
            'desc': '_desc', // description field
            'style': '_style' // description field
        },
        'definitions': {
            'db': 'aoLists', // database where definitions collection is kept
            'collection': '_defs' // collection where definitions are kept
        },
        'users': {
            'db': 'aoLists', // database where user collection is kept
            'label': 'users', // route name to be used for user related routes
            'collection': 'users', // collection where users are kept
            'mgrlevel': 'manager', // manager level
            'metadata': {
                'field': '_metadata', // field to use to store the user profile
            },
            'fields': {
                'namefld': 'username', // field that holds the user name
                'pwdfld': 'hash', // field that holds the MD5 hash of the password
                'levelfld': 'level', // boolean field that holds the manager level flag
                'syncfld': 'syncs' // object field that holds the sync date/times
            },
            'customAuth': null // 
        },
        'attach': {
            'db': 'aoLists', // database where attachment links are kept
            'collection': '_attach', // collection where attachment links are kept
            'fields': {
                'parentfld': 'parent', // field that holds the parent key
                'attfld': 'att', // field that holds the attachment key
                'verpfld': 'pver', // field that holds the parents version
                'vercfld': 'cver', // field that holds the childs version
                'descpfld': 'pdesc', // field that holds the parents description
                'desccfld': 'cdesc', // field that holds the childs description
                'stylefld': 'style' // field that holds the version
            }
        },
        'web': {
            'index': 'index.html',
            'css': 'styles.css',
            'add': 'add.html',
            'del': 'del.html'
        },
        'defs': {
            'db': 'aoLists', // database where definitions collection is kept
            'collection': 'defs' // collection where definitions are kept
        },
        'util': {
            'label': 'util' // route name to be used for util related routes
        }
    }
};
try {
    // config.json hold CHANGES to the settings above
    config = aofn.mergeRecursive(config, JSON.parse(fs.readFileSync(process.cwd() + '/config.json')));
} catch (e) {
    console.log('Unable to read "' + process.cwd() + '/config.json' + '" - ' + e);
}
aofn.config = config;

// Load rest
require('./lib/util_auth');
require('./lib/util_crypto');
require('./lib/util_response');
require('./lib/util_parser');
require('./lib/util_db');
require('./lib/util_doc');
require('./lib/util_user');
require('./lib/util_subs');
require('./lib/util_att');
require('./lib/util_ao');
require('./lib/util_wu');

// Log mode
if (aofn.config.debug) {
    console.log('aoLists-db launching...');
}

// Count CPUs
var numCPUs = require('os').cpus().length;

if (!aofn.config.debug && numCPUs > 1 && cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('death', function (worker) {
        if (aofn.config.debug) {
            console.log('worker ' + worker.pid + ' died');
        }
    });
} else {
    // Worker processes have a http server.
    var express = require('express');
    var app = module.exports.app = express();

    // Load routes
    require('./lib/rest');

    //process.on('exit', function (){
    //	console.log('Goodbye!');
    //});

    // Error handler - no code passed back
    if (!aofn.config.debug) {
        app.use(function (err, req, res, next) {
            res.send(500, 'Internal error');
        });
    }

    // Try to get SSL certificate and private key
    var sslCert,
        pk;
    try {
        pk = fs.readFileSync(process.cwd() + '/pk.pem');
        sslCert = fs.readFileSync(process.cwd() + '/cert.pem');
    } catch (e) {}

    var server;
    // Do we have an SSL cert?
    if (sslCert) {
        // Launch HTTPS
        var https = require('https');
        server = https.createServer({
            key: pk,
            cert: sslCert
        }, app).listen(aofn.config.server.port, function () {
            console.log('aoLists SSL server started on port ' + aofn.config.server.port);
        });
    } else {
        // Launch HTTP
        var http = require('http');
        server = http.createServer(app).listen(aofn.config.server.port, function () {
            console.log('aoLists server started on port ' + aofn.config.server.port);
        });
    }
}