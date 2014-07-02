var express = require('express'),
    app = express(),
    fs = require('fs'),
    http = require('http');
var server = app.listen(8877,function(){
    console.log('server is running on 8877');
});


var data = require('./ga.js');

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/api/ga.json', function (req, res) {
    var search = req.originalUrl.replace('/api/ga.json?', '');
    data.get_raw_data(search, function (data) {
        res.send(data);
    });
});
