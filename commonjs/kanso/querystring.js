var _ = require('./underscore')._;

/**
 * From node.js v0.2.6
 */

// Query String Utilities

var QueryString = exports;

// node.js version uses this in place of decodeURIComponent
//var urlDecode = process.binding("http_parser").urlDecode;

QueryString.unescape = function (str) {
    return decodeURIComponent(str);
};

QueryString.escape = function (str) {
    return encodeURIComponent(str);
};


var stack = [];

QueryString.stringify = function (obj, sep, eq, munge, name) {
    munge = typeof munge === "undefined" || munge;
    sep = sep || "&";
    eq = eq || "=";
    var type = Object.prototype.toString.call(obj);
    if (obj === null || type === "[object Function]" || type === "[object Number]" && !isFinite(obj)) {
        return name ? QueryString.escape(name) + eq : "";
    }

    switch (type) {
    case '[object Boolean]':
        obj = +obj; // fall through
        break;
    case '[object Number]':
        break;
    case '[object String]':
        return QueryString.escape(name) + eq + QueryString.escape(obj);
    case '[object Array]':
        name = name + (munge ? "[]" : "");
        return _.map(obj, function (item) {
            return QueryString.stringify(item, sep, eq, munge, name);
        }).join(sep);
    }
    // now we know it's an object.

    // Check for cyclical references in nested objects
    for (var i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i] === obj) {
            throw new Error("querystring.stringify. Cyclical reference");
        }
    }

    stack.push(obj);

    var begin = name ? name + "[" : "",
        end = name ? "]" : "",
        keys = _.keys(obj),
        n,
        s = _.map(_.keys(obj), function (key) {
            n = begin + key + end;
            return QueryString.stringify(obj[key], sep, eq, munge, n);
        }).join(sep);

    stack.pop();

    if (!s && name) {
        return name + "=";
    }
    return s;
};

// matches .xxxxx or [xxxxx] or ['xxxxx'] or ["xxxxx"] with optional [] at
// the end
var chunks = new RegExp(
    '(?:(?:^|\\.)([^\\[\\(\\.]+)(?=\\[|\\.|$|\\()|' +
    '\\[([^"\'][^\\]]*?)\\]|\\["([^\\]"]*?)"\\]|' +
    '\\[\'([^\\]\']*?)\'\\])(\\[\\])?',
    'g'
);

// Parse a key=val string.
QueryString.parse = function (qs, sep, eq) {
    var obj = {};
    if (qs === undefined) {
        return {};
    }
    _.map(String(qs).split(sep || "&"), function (keyValue) {
        var res = obj,
            next,
            kv = keyValue.split(eq || "="),
            key = QueryString.unescape(kv.shift(), true),
            value = QueryString.unescape(kv.join(eq || "="), true);

        key.replace(chunks, function (all, name, nameInBrackets, nameIn2Quotes, nameIn1Quotes, isArray, offset) {
            var end = offset + all.length === key.length;
            name = name || nameInBrackets || nameIn2Quotes || nameIn1Quotes;
            next = end ? value : {};
            if (_.isArray(res[name])) {
                res[name].push(next);
                res = next;
            }
            else {
                if (name in res) {
                    if (isArray || end) {
                        res = (res[name] = [res[name], next])[1];
                    }
                    else {
                        res = res[name];
                    }
                }
                else {
                    if (isArray) {
                        res = (res[name] = [next])[0];
                    }
                    else {
                        res = res[name] = next;
                    }
                }
            }
        });
    });
    return obj;
};
