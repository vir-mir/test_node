var express = require('express'),
	app = express(),
	port = 8080,
	server = require('http').createServer(app).listen(port),
	path = require('path'),
	io = require('socket.io').listen(server),
	subscribes_set = require('./app/subscribes.js').subscribes_set,
	get_assets = require('./app/assets.js').get_assets,
	run_subscribe = require('./app/subscribes.js').run_subscribe,
	run_parser = require('./app/assets.js').run_parser;

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

require('./app/routers.js')(app);

var Clients = function () {
	this.sockets = [];
};

var clients = new Clients();

run_parser(clients);
run_subscribe(clients);

console.log('Server is Up and Running at Port : ' + port);

io.sockets.on('connection', function (socket) {
	clients.sockets.push(socket);

	// Навешиваем обработчик на входящее сообщение
	socket.on('message', function (msg) {
		switch (msg['action']) {
			case 'subscribe':
				subscribes_set(msg, this);
				break;
			case 'assets':
				get_assets(this);
				break;
		}
	});

	// При отключении клиента
	socket.on('disconnect', function() {
		clients.sockets = clients.sockets.filter(function (i) { return i.id != this.id});
	});
});
