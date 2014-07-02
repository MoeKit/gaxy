var express = require('express'),
    app = express(),
    fs = require('fs'),
    http = require('http');
var server = app.listen(8877);


var data = require('./ga.js');

app.use(express.methodOverride());

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
