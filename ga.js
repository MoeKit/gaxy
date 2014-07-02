/**
 * get GA data
 * @author airyland <i@mao.li>
 */
var fs = require('fs'),
    config = require('./config/newga.json'), //JSON.parse(fs.readFileSync('./config/ga.json')),
    authConfig = require('./ga.json');
    googleapis = require('googleapis'),
    CLIENT_ID = authConfig.CLIENT_ID,
    CLIENT_SECRET = authConfig.CLIENT_SECRET,
    REDIRECT_URL = authConfig.REDIRECT_URL,
    APIKEY = authConfig.REDIRECT_URL,
    OAuth2Client = googleapis.OAuth2Client,
    oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL),
    data = {};

var crypto = require('crypto');

function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

// 日期格式化
var format = function (date) {
    var month = (date.getMonth() + 1) + '';
    return date.getFullYear() + '-' + (month.length === 1 ? '0' + month : month) + '-' + date.getDate();
};

var daysAgo = function (day, date) {
    var today;
    if (date) {
        today = +new Date(date);
    } else {
        today = +new Date();
    }

    var offset = day * 24 * 3600 * 1000;
    return format(new Date(today - offset));
};

const now = daysAgo(2);
const oneMonthAgo = daysAgo(30);

oauth2Client.credentials = config;

var events = require('events'),
    eventEmitter = new events.EventEmitter(),
    currentAct;

eventEmitter.on('refresh_token', function (option, callback, cacheName) {
    console.log('token expired');
    oauth2Client.refreshToken_(oauth2Client.credentials['refresh_token'], function (err, data) {
        if (err) throw err;
        config.access_token = data.access_token;
        fs.writeFile('config/ga.json', JSON.stringify(config), function (err) {
            if (err) throw err;
            console.log('config save successfully');
        });
        doFetch(option, callback, cacheName);
    });
});

function get_raw_data(option, callback) {
    var querystring = require('querystring');
    //var cacheName = md5(option);
    //console.log(cacheName);
    //console.log(querystring.parse(option));
    // 转换为对象
    if (typeof option !== 'object') {
        option = querystring.parse(option);
    }
    doFetch(option, callback, 'raw/' + encodeURI(option));
}

function doFetch(option, callback, cacheName) {
    var _option = option,
        _cacheName = cacheName;
    if (!option['start-date']) {
        option['start-date'] = oneMonthAgo;
        option['end-date'] = now;
    }
    //option['start-date']='2013-05-01';
    //option['end-date']='2013-05-24';
    cacheName = cacheName.split('/')[0] + '/' + md5(cacheName.split('/')[1]) + '.json';
    console.log(cacheName);
    var isCacheExists = fs.existsSync('./cache/' + cacheName);
    console.log(option.filters);
    if (isCacheExists) {
        //console.log(option);
        //console.log(require('querystring').stringify(option));
        console.log('缓存存在');
        // 读取缓存
        var data = require('./cache/' + cacheName);
        callback && callback.call(this, data);
    } else {
        console.log('缓存不存在, to get it');
        googleapis.discover('analytics', 'v3')
            .execute(function (err, client) {
                if(err){
                    console.log(err);
                    return;
                }
                console.log(client);
                client.analytics.data.ga.get(option)
                    .withAuthClient(oauth2Client)
                    .execute(function (err, data) {
                        console.log(err);
                        if (err && err['code'] === 401) {

                            console.log('授权过期');
                            console.log('expired token');
                            eventEmitter.emit('refresh_token', option, callback, cacheName);
                        } else {
                            console.log('数据到手');
                            var returnData = data;
                            /*{
                             total: data.totalsForAllResults,
                             rows: data.rows
                             }*/
                            //console.log(data);
                            /*if(data===undefined){
                             doFetch(_option,callback,_cacheName)
                             }*/
                            if (returnData === undefined) {
                                callback && callback.call(this, {
                                    rows: []
                                });
                            } else {
                                fs.writeFile('./cache/' + cacheName, JSON.stringify(returnData));
                                callback && callback.call(this, returnData);
                            }
                            // 写入缓存

                        }
                    });
            });
    }
}

// 62079070 全站数据
// 61918595  m 站数据
// 644519 bbs 数据
module.exports = {
    get_raw_data: get_raw_data
};