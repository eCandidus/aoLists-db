/**
 *
 *		util_socket.js
 *		aolists
 *
 *      String related calls
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var app = module.parent.exports.app,
    aofn = module.parent.exports.aofn,
    socketi = require('socket.io'),
    nodemailer = require('nodemailer');

/**
 *  socket - socket.io interface
 */
aofn.socket = {
    // The interface
    conn: null,
    // User table
    users: {},
    // Node mailer transport
    nmtransport: null,

    init: function (server) {
        // Create server
        aofn.socket.conn = socketi(server);
        // Handle connections
        aofn.socket.conn.on('connection', function (socket) {
            // A new connection takes place
            socket.on('disconnect', function (msg) {
                if (socket.users) {
                    aofn.socket.removeSocket(socket);
                }
            });
            socket.on('in', function (msg) {
                msg.name = aofn.userNRULE(msg.name);
                if (msg.name) {
                    aofn.socket.addSocket(socket, msg.name);
                }
            });
            socket.on('out', function (msg) {
                msg.name = aofn.userNRULE(msg.name);
                if (msg.name) {
                    aofn.socket.removeSocket(socket, msg.name);
                }
            });
            socket.on('qm', function (msg) {
                aofn.socket.qm(msg);
            });
        });
    },

    addSocket: function (socket, name) {
        // At this level, each socket can have multiple users using it!
        socket.users = socket.users || [];
        name = aofn.userNRULE(name);
        if (name) {
            if (socket.users.indexOf(name) == -1) {
                socket.users.push(name);
                var conn = aofn.socket.users[name] || [];
                var found = false;
                for (var i = conn.length; i > 0; i--) {
                    var wsock = conn[i - 1];
                    if (socket.id === wsock.id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    conn.push(socket);
                    aofn.socket.users[name] = conn;
                }
            }
            // Send what has been in queue
            var req = {};
            var res = {};
            var query = aofn.queryXXX('to', name);
            aofn.executeDB(req, res, aofn.config.db.notifications.db, function (req, res, db) {
                db.collection(aofn.config.db.notifications.collection, function (err, collection) {
                    if (!err) {
                        collection.find(query, options, function (err, cursor) {
                            if (!err) {
                                cursor.toArray(function (err, docs) {
                                    if (!err) {
                                        docs.forEach(function (msg) {
                                            var type = mg[aofn.config.db.notifications.fields.typefld];
                                            if (type && typeof aofn.socket[type] == 'function') {
                                                delete msg[aofn.config.db.notifications.fields.typefld];
                                                aofn.socket[type](msg);
                                            }
                                            collection.remove(aofn.queryXXX('_id', msg._id), function (err) {});
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });

            var inqueue = aofn.socket.queue[name];
            if (inqueue) {
                inqueue.forEach(function (msg) {
                    aofn.socket.qm(msg);
                });
                delete aofn.socket.queue[name];
            }
        }
    },

    removeSocket: function (socket, name) {
        // At this level, each socket can have multiple users using it!
        socket.users = socket.users || [];
        if (!name) {
            // Entire socket going away!
            socket.users.forEach(function (user) {
                var conn = aofn.socket.users[user] || [];
                for (var i = conn.length; i > 0; i--) {
                    var wsock = conn[i - 1];
                    if (socket.id === wsock.id) {
                        conn.splice(i - 1, 1);
                    }
                }
                if (conn.length) {
                    aofn.socket.users[user] = conn;
                } else {
                    delete aofn.socket.users[user];
                }
            });
        } else {
            var at = socket.users.indexOf(name);
            if (at != -1) {
                socket.users.splice(at, 1);
                var conn = aofn.socket.users[name] || [];
                for (var i = conn.length; i > 0; i--) {
                    var wsock = conn[i - 1];
                    if (socket.id === wsock.id) {
                        conn.splice(i - 1, 1);
                    }
                }
                if (conn.length) {
                    aofn.socket.users[name] = conn;
                } else {
                    delete aofn.socket.users[name];
                }
            }
        }
    },

    qm: function (msg) {
        if (msg.to) {
            if (/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(msg.to)) {
                if (aofn.config.db.notifications.smtp) {
                    if (!aofn.socket.nmtransport) {
                        aofn.socket.nmtransport = nodemailer.createTransport(smtpTransport(aofn.config.db.notifications.smtp));
                    }
                    aofn.socket.nmtransport.sendMail({
                        'from': aofn.config.db.notifications.smtp.auth.user,
                        'to': msg.to,
                        'subject': msg.subject || aofn.config.db.notifications.smtpsubject,
                        'text': msg.message
                    });
                }
            } else if (/^\w+([-+.']\w+)*@\w+([-.]\w+)*$/.test(msg.to)) {
                aofn.socketserver.emit('qm', msg);
            } else {
                msg.to = aofn.userNRULE(msg.to);
                if (msg.to) {
                    var conn = aofn.socket.users[msg.to] || [];
                    if (conn.length) {
                        conn.forEach(function (tosocket) {
                            try {
                                tosocket.emit('qm', msg);
                            } catch (e) {}
                        });
                    } else {
                        var sent = false;

                        if (aofn.config.db.notifications.googleGCMKey || aofn.config.db.notifications.appleAPNKey) {
                            var req = {};
                            var res = {};
                            aofn.userGET(req, res, msg.to, function (req, res, user, doc) {
                                var sent = false;
                                if (aofn.config.db.notifications.googleGCMKey && doc.googleGCMID) {
                                    var gcm = require('../tp/node-gcm/node-gcm');
                                    var sender = new gcm.Sender(aofn.config.db.notifications.serverGCMKey);
                                    var message = new gcm.Message({
                                        collapseKey: aofn.UUID,
                                        delayWhileIdle: true,
                                        dryRun: false,
                                        timeToLive: 60 * 60, // 1 hour
                                        data: msg
                                    });
                                    sender.send(message, [doc.googleGCMID], function (err, result) {});
                                    sent = true;
                                }
                                if (aofn.config.db.notifications.appleAPNKey && doc.appleAPNID) {
                                    // TBD
                                }
                                if (!sent) {
                                    aofn.socket.addToQueue('qm', msg);
                                }
                            });
                        } else {
                            aofn.socket.addToQueue('qm', msg);
                        }
                    }
                }
            }
        }
    },

    data: function (msg) {
        if (msg.to) {
            if (/^\w+([-+.']\w+)*@\w+([-.]\w+)*$/.test(msg.to)) {
                aofn.socketserver.emit('data', msg);
            } else {
                msg.to = aofn.userNRULE(msg.to);
                // TBD
            }
        }
    },

    addToQueue: function (msg) {
        var req = {};
        var res = {};

        msg[aofn.config.db.data.fields.fldtype] = type;

        aofn.executeDB(req, res, aofn.config.db.notifications.db, function (req, res, db) {
            db.collection(aofn.config.db.notifications.collection, function (err, collection) {
                if (!err) {
                    collection.insert(msg, {
                        w: aofn.config.db.w || 1,
                        continueOnError: true
                    }, function (err, fdoc) {});
                }
            });
        });
    }
};

aofn.socketserver = {
    // The socket to the server
    socket: null,
    // Recovery
    intervalID: null,

    init: function () {
        if (aofn.config.aoListsExchange.uuid) {
            aofn.socketserver.socket = require('socket.io-client')(aofn.format('https://{0}:{1}', aofn.config.aoListsExchange.host, aofn.config.aoListsExchange.port));
            aofn.socketserver.socket.on('connect', function () {
                if (aofn.socketserver.intervalID) {
                    clearInterval(aofn.socketserver.intervalID);
                    aofn.socketserver.intervalID = null;
                }
                aofn.socketserver.socket.emit('in', aofn.config.aoListsExchange);
                aofn.socketserver.socket.on('qm', function (msg) {
                    msg.to = aofn.userLOCAL(msg.to);
                    aofn.socket.qm(msg);
                });
                aofn.socketserver.socket.on('data', function (msg) {
                    msg.to = aofn.userLOCAL(msg.to);
                    aofn.socket.data(msg);
                });
                socket.on('disconnect', function () {
                    if (!aofn.socketserver.intervalID) {
                        aofn.socketserver.intervalID = setInterval(aofn.socketserver.reconnect, 2000);
                    }
                });
            });
        }
    },

    reconnect: function () {
        if (aofn.socketserver.socket.connected === false) {
            aofn.socketserver.socket.connect();
        }
    },

    emit: function (fn, msg) {
        if (aofn.socketserver.socket) {
            msg.from = aofn.userGLOBAL(msg.from);
            aofn.socketserver.socket.emit(fn, msg);
        }
    }
};