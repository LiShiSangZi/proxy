var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var config = require('./config');
var url = require('url');
var express = require('express');
var http = require('http');
var request = require('request');
var events = require('events');
var eventEmitter = new events.EventEmitter();

var wss = new WebSocketServer(config.server);

wss.on('connection', function(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  var path = location.path;
  var address = config.remote.address + path;
  if (location.query && location.query.redirect) {
    address = config.remote.list2;
  }
  var webSocket = new WebSocket(address);


  var messageList = [];
  var connected = false;

  var regExp = new RegExp('\"ws\:\/\/(.*?)\:' + config.server.port + '(.*?)\"');

  var wsClosed = false;
  var webSocketClose = false;

  function sendMessage() {
    if (!webSocketClose) {
      messageList.forEach(function(message) {

        webSocket.send(message);
      });
    }

    messageList = [];
  }

  ws.on('message', function(message) {
    message = message.replace(ws.upgradeReq.headers.host, config.remote.address.replace('ws://', ''));
    messageList.push(message);

    if (connected) {
      sendMessage();
    }

  });

  ws.on('close', function(code, data) {
    // Client side disconnected.
    wsClosed = true;
    webSocket.close(code, data);
  });

  ws.on('error', function(error) {
    webSocket.close()
  });

  ws.on('ping', function(data, flags) {
    webSocket.ping(data);
  });

  ws.on('pong', function(data, flags) {
    webSocket.pong(data);
  });



  webSocket.on('close', function(code, data) {
    // Client side disconnected.
    webSocketClose = true;
    ws.close(code, data);
  });

  webSocket.on('error', function(error) {
    ws.close()
  });

  webSocket.on('ping', function(data, flags) {
    ws.ping(data);
  });

  webSocket.on('pong', function(data, flags) {
    ws.pong(data);
  });

  webSocket.on('open', function() {
    connected = true;

    // console.log(webSocket);
    sendMessage();
  });

  var reg = /redirectURL(\"*)\:\"xre(.*?)\"/;

  webSocket.on('message', function(msg, flag) {

    msg = msg.replace(/\"((\w+)\:\/\/(.*?)\.xcal.tv\:(\d+)\/(.*?))\"/, '"ws://' + ws.upgradeReq.headers.host + '?redirect=$1"');
    if (!wsClosed) {
      ws.send(msg);
      eventEmitter.emit('message', msg);
    }
  })
});


var montor = new WebSocketServer(config.monitor);
monitor.on('connection', function(ws) {
  eventEmitter.addListener('message', function() {
    console.log(arguments);
  });
});

// Add proxy service.

var app = express();
app.get('/proxy', function(req, res, next) {
  var url = req.query.url;
  var u = url;
  if (config.remote.proxy) {
    u = 'http://' + config.remote.proxy + '/proxy?url=' + encodeURIComponent(url);
  }
  request.get(u).on('error', function(error) {
    res.status(404).send('Not Found');
  }).pipe(res);
});
var port = process.env.PORT || '9888';
app.set('port', port);


var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
