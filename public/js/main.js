/**
 * Created by vir-mir on 11.04.16.
 */
var socket = io.connect('http://localhost:8080');

var cookie_parse = function(cookie) {
    var cookies = {};
    cookie.split(';').map(function (item) {
        item = item.trim().split('=');
        cookies[item[0]] = decodeURIComponent(item[1]);
    });
    return cookies;
};

var cookie_set = function(name, value, path, time) {
    path = path || '/';
    time = time || new Date(new Date().getTime() + 60 * 60 * 1000);
    document.cookie = name + "=" + value + "; path=" + path + "; expires=" + time.toUTCString();
};


socket.on('message', function (msg) {
    switch (msg['action']) {
        case 'assets':
            console.log(msg);
            break;
        case 'point':
            //console.log(msg);
            break;
        case 'asset_history':
            console.log(msg);
            break;
    }
});

var set_subscribe = function(socket, id_subscribe) {
    var cookies = cookie_parse(document.cookie);
    var subscribe;
    if (!cookies['subscribe']) {
        var time = new Date().getTime();
        cookie_set('subscribe', time);
        subscribe = time;
    } else {
        subscribe = cookies['subscribe']
    }
    socket.send({action: 'subscribe', subscribe: subscribe, id_subscribe: id_subscribe});
};
var cookies = cookie_parse(document.cookie);
if (cookies['subscribe']) {
    socket.send({action: 'subscribe', subscribe: cookies['subscribe']});
}

var get_assets = function(socket) {
    socket.send({action: 'assets'});
};