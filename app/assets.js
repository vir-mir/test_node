/**
 * Created by vir-mir on 11.04.16.
 */

var redis = require("redis").createClient(),
	request = require('request'),
	send_subscribes = require('./subscribes.js').send_subscribes,
	assets = {
	1: 	'EURUSD',
	2: 	'USDJPY',
	3: 	'GBPUSD',
	4: 	'AUDUSD',
	5: 	'USDCAD'
};

var assets_set = function (data) {
	return data['Rates'].map(function (asset) {
		var message = {average: (parseFloat(asset['Bid']) + parseFloat(asset['Ask'])) * 2};
		for (var key in assets) {
			if (assets[key] == asset['Symbol']) {
				message['name'] = assets[key];
				message['id'] = parseInt(key);
				break;
			}
		}
		return message;
	});
};

var run_parser = function (clients) {
    setInterval(function () {
		var url = 'https://ratesjson.fxcm.com/DataDisplayer?symbols=';
		for (var key in assets) {
			url += assets[key] + ',';
		}
		var timestamp = Math.round(new Date().getTime()/1000.0);
		url += "&since=" + timestamp + '&callback=';
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var key = 'assets_' + timestamp,
					data = eval('assets_set' + body);
				redis.set(key, JSON.stringify(data));
				redis.expireat(key, timestamp * 1800);
				send_subscribes(clients, data, timestamp);
			  }
		});
    }, 1000);
};

var get_assets = function (socket) {
	var assets_items = [];
	redis.keys('assets_*', function (err, keys) {
		redis.mget(keys, function (err, replies) {
			assets_items = replies.map(function (val, index) {
				var asset = JSON.parse(val);
				asset['timestamp'] = parseInt(keys[index].replace('assets_', ''));
				return asset;
			});
			socket.send({'action': 'assets', 'message': assets_items})
		});
	});
};

module.exports.assets = assets;
module.exports.get_assets = get_assets;
module.exports.run_parser = run_parser;
