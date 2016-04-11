var redis = require("redis").createClient();

module.exports.subscribes_set = function (msg, socket) {
    var key = 'subscribe_' + msg['subscribe'];
    redis.get(key, function (err, val) {
        val = val ? JSON.parse(val) : {};
        val['id_subscribe'] = msg['id_subscribe'] ? msg['id_subscribe'] : val['id_subscribe'];
        val['id'] = socket.id;
        redis.set(key, JSON.stringify(val));
    });
};

var send = function (client, assets, subscribe, timestamp) {
    var asset = assets.filter(function(i) { return i.id == subscribe['id_subscribe']});
    if (asset.length > 0) {
        asset = asset.pop();
        asset['time'] = timestamp;
        client.send({action: 'point', message: asset})
    }
    return asset
};

var send_subscribes = function (clients, assets, timestamp, callback) {
    callback = callback || send;
    redis.keys('subscribe_*', function (err, keys) {
		redis.mget(keys, function (err, subscribes) {
            if (subscribes) {
                subscribes.map(function (subscribe) {
                    var subscribe = JSON.parse(subscribe),
                        client = clients.sockets.filter(function (i) { return i.id == subscribe['id']; });
                    if (subscribe['id_subscribe'] && client.length > 0) {
                        callback(client.pop(), assets, subscribe, timestamp)
                    }
                });
            }
		});
	});
};

var run_subscribe = function (clients) {
    setInterval(function () {
        var timestamp = Math.round(new Date().getTime()/1000.0) - 300;
        redis.keys('assets_*', function (err, keys) {
            keys = keys.filter(function (key) {
                var time = parseInt(key.replace('assets_', ''));
                return time >= timestamp;
            });
            redis.mget(keys, function (err, assets) {
                if (assets) {
                    assets = assets.map(function (asset, index) {
                        var time = parseInt(keys[index].replace('assets_', ''));
                        return JSON.parse(asset).map(function (i) {
                            i['time'] = time;
                            return i
                        });
                    });
                    send_subscribes(clients, assets, timestamp, function (client, assets, subscribe) {
                        client.send({action: 'asset_history', message: assets.map(function (item) {
                            return item.filter(function(i) { return i.id == subscribe['id_subscribe']}).pop();
                        })});
                    });

                }
            });
        });
    }, 1000 * 300);
};

module.exports.run_subscribe = run_subscribe;
module.exports.send_subscribes = send_subscribes;
