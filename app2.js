var debug = require('debug')('recStream');
var ejs = require('ejs');
var express = require('express');
var fs = require('fs');
var http = require('http');
var path = require('path');
var WebSocketServer = require('websocket').server;

var app = express();

var stream = require('./routes/stream');
var index = require('./routes/index');

var firstPacket = [];

/** All ws clients */
var wsClients = [];

app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.use('/', index);
app.use('/video', stream);

app.use(express.static(path.join(__dirname, 'public')));


app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});

var options = {
    host:'218.75.53.42',
    port:'80',
    path:'/yfhdl.cdn.zhanqi.tv/zqlive/69410_SgVxl.flv?k=58c88058d87a61777f4f28904352492d&t=58e6f371&device=0&playNum=3809026147&gId=1668577796&bAi=false',
    method:'GET'
}

function getStream(){
    var req = http.request(options, function(res){
        console.log('STATUS' + res.statusCode);
        var chunks = [];
        res.on('data', function(chunk){
            chunks.push(chunk);

            /**
             * We are saving first packets of stream. These packets will be send to every new user.
             * This is hack. Video won't start whitout them.
             */
            if(firstPacket.length < 3){
                console.log('Init first packet', firstPacket.length);
                firstPacket.push(chunk);
            }

            /**
             * Send stream to all clients
             */
            wsClients.map(function(client, index){
                client.sendBytes(chunk);
            });

        });

        res.on('end', function(){
            //writeStream.end();
        })
    });

    req.end();
}

/** Websocet */
var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

wsServer.on('request', function(request) {
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    getStream();

    if(firstPacket.length){
        /**
         * Every user will get beginnig of stream
         **/
        firstPacket.map(function(packet, index){
            connection.sendBytes(packet);
        });

    }

    /**
     * Add this user to collection
     */
    wsClients.push(connection);
    connection.on('message', function(message) {
        console.log(message.type)
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});






var recStream = function (req, resp) {
    console.log("111111")
};

var isNumber = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);        
};

