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
    address = location.query.redirect;
    if (/^wws/.test(address)) {

    } else {
      address = config.remote.list;
    }
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

        if (message) {
          if (message.params && message.params.connectURL) {
            message.params.connectURL = message.params.connectURL.replace(regExp, '"' + config.remote.address + path + '"');
          } else if (typeof message == 'string') {
            message = message.replace(/\"connectURL\"\:\"ws\:(.*?)\?redirect\=(.*?)\"/, '"connectURL": "$2"');
          }
        }

        webSocket.send(message);
      });
    }

    messageList = [];
  }

  ws.on('message', function(message) {
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
    // Find out the websocket msg.
    // msg = JSON.parse(msg);
    if (typeof msg == 'object') {

      if (msg.redirectURL) {
        msg.redirectURL = 'xre://' + ws.upgradeReq.headers.host + '?redirect=' + msg.redirectURL.replace(/^(.*)redirect=(.*?)$/, '$2').replace(/^xre/, 'ws');
      }
      if (msg.klass == 'XREApplication') {
        msg.params.url = 'wss://' + ws.upgradeReq.headers.host + '?redirect=' + msg.params.url.replace(/^(.*)redirect=(.*?)$/, '$2');
      }
    } else if (typeof msg == 'string') {
      msg = msg.replace(/(.*)\"(.*?)redirect=(.*?)\"/, '$1$3');

      if (/redirect/.test(msg)) {
        console.log(msg);
      }
      
      msg = msg.replace(reg, 'redirectURL$1:"xre://' + ws.upgradeReq.headers.host + '/?redirect=ws$2"');


      if (/XREApplication/.test(msg)) {
        msg = msg.replace(/\"url\"\:\"(.*?)\"/, '"url":"' + 'ws://' + ws.upgradeReq.headers.host + '/?redirect=$1"');
      }

      msg = msg.replace(/\"(\w*?)\:\/\/(.*?)\:(\d+)\/(.*?)\"/, '"$1://' + ws.upgradeReq.headers.host + '?redirect=' + '$1://$2:$3/$4"');
    }
    // msg = JSON.stringify(msg);
    if (!wsClosed) {
      ws.send(msg);
    }
  })
});
