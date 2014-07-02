var express = require('express'),
    app = express(),
    fs = require('fs'),
    http = require('http');
var server = app.listen(8877);

/**
 * Removes a module from the cache
 */
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });
};

/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });
            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};

var data = require('./ga.js');

app.use(express.methodOverride());
app.use(express.static(__dirname + '/cache'));

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// home page
app.get('/', function (req, res) {
    res.send('Hello, I\'m seedit Data Visualization Center');
});

var httpGet = function (url, callback) {
    var http = require('http');
    http.get(url, function (rs) {
        var data = '';
        rs.on('data', function (chunk) {
            data += chunk;
        });
        rs.on('end', function () {
            callback(data);
        });
    })

};


// 获取 google 统计
// 使用代理服务器
app.get('/api/ga.json', function (req, res) {
    var search = req.originalUrl.replace('/api/ga.json?', '');
    data.get_raw_data(search, function (data) {
        res.send(data);
    });
});
