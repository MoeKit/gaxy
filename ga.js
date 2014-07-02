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
var querystring = require('querystring');

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
    // 转换为对象
    if (typeof option !== 'object') {
        option = querystring.parse(option);
    }
    doFetch(option, callback, md5(encodeURI(querystring.stringify(option))));
}

function doFetch(option, callback, cacheName) {
    var _option = option,
        _cacheName = cacheName;
    if (!option['start-date']) {
        option['start-date'] = oneMonthAgo;
        option['end-date'] = now;
    }
    var isCacheExists = fs.existsSync('./cache/' + cacheName + '.json');
    if (isCacheExists) {
        console.log('缓存存在');
        // 读取缓存
        var data = require('./cache/' + cacheName);
        callback && callback.call(this, data);
    } else {
        console.log('缓存不存在, to get it');
        googleapis.discover('analytics', 'v3')
            .execute(function (err, client) {
                if (err) {
                    console.log('error', err);
                    return;
                }
                client.analytics.data.ga.get(option)
                    .withAuthClient(oauth2Client)
                    .execute(function (err, data) {
                        if (err) {
                            console.log(err);
                        }
                        if (err && err['code'] === 401) {
                            console.log('授权过期');
                            console.log('expired token');
                            eventEmitter.emit('refresh_token', option, callback, cacheName);
                        } else {
                            console.log('数据到手');
                            var returnData = data;
                            if (returnData === undefined) {
                                callback && callback.call(this, {
                                    rows: []
                                });
                            } else {
                                fs.writeFile('./cache/' + cacheName + '.json', JSON.stringify(returnData));
                                callback && callback.call(this, returnData);
                            }
                        }
                    });
            });
    }
}

module.exports = {
    get_raw_data: get_raw_data
};