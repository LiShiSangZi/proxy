var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var config = require('./config');
var url = require('url');

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
    console.log(ws.upgradeReq.host);
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
    }
  })
});
