/**
 *
 *		util_string.js
 *		aolists
 *
 *      String related calls
 *
 *		2014-06-17	-	Changes to support aolLists client (by Jose E. Gonzalez jr)
 */
var app = module.parent.exports.app,
    aofn = module.parent.exports.aofn,
    fs = require('fs');

/**
 *  hasValue - return true if string value is not empty
 */
aofn.hasValue = function (value) {
    return (value && value.length);
};

/**
 *  format - formats a string in ,NET fashion
 */
aofn.format = function () {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
};

/**
 *  endsWith - tests the end of the value string for the suffix
 */
aofn.endsWith = function (value, suffix) {
    return (value.substr(value.length - suffix.length) === suffix);
};

/**
 *  startsWith - tests the beginning of the value string for the prefix
 */
aofn.startsWith = function (value, prefix) {
    return (value.substr(0, prefix.length) === prefix);
};

/**
 * UUID - generates universally unique identifier (v4)
 */
aofn.UUID = function () {
    var uuid = "",
        i, random;
    for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;
        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += "-"
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
};