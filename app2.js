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
    //var stream;
    //var stat;
    ////var rootFolder = "videos/";
    //var rootFolder = "";
    //var info = {};
    //var range = typeof req.headers.range === "string" ? req.headers.range : undefined;
    //var reqUrl = url.parse(req.url, true);
    //
    //info.path = typeof reqUrl.pathname === "string" ? reqUrl.pathname.substring(1) : undefined;
    //if (info.path) {
    //    try {
    //        info.path = decodeURIComponent(info.path);
    //    } catch (exception) {
    //        console.log("Video Streamer bad request received - " + resp);         // Can throw URI malformed exception.
    //        return false;
    //    }
    //}
    //
    //info.file = info.path.match(/(.*[\/|\\])?(.+?)$/)[2];
    //info.path = rootFolder + info.path;
    //
    //try {
    //    stat = fs.statSync(info.path);
    //    if (!stat.isFile()) {
    //        console.log("Video Streamer bad file specified - " + resp);
    //        return false;
    //    }
    //} catch (e) {
    //    console.log("Video Streamer bad file specified - " + resp + " " + e);
    //    return false;
    //}
    //
    //info.start = 0;
    //info.end = stat.size - 1;
    //info.size = stat.size;
    //info.modified = stat.mtime;
    //info.rangeRequest = false;
    //info.maxAge = "3600";
    //info.server = info.file;
    //info.mime = "video/mp4";
    //
    //if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
    //    // Check range contains numbers and they fit in the file. Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
    //    info.start = isNumber(range[1]) && range[1] >= 0 && range[1] < info.end ? range[1] - 0 : info.start;
    //    info.end = isNumber(range[2]) && range[2] > info.start && range[2] <= info.end ? range[2] - 0 : info.end;
    //    info.rangeRequest = true;
    //} else if (reqUrl.query.start || reqUrl.query.end) {
    //    // This is a range request, but doesn't get range headers.
    //    info.start = isNumber(reqUrl.query.start) && reqUrl.query.start >= 0 && reqUrl.query.start < info.end ? reqUrl.query.start - 0 : info.start;
    //    info.end = isNumber(reqUrl.query.end) && reqUrl.query.end > info.start && reqUrl.query.end <= info.end ? reqUrl.query.end - 0 : info.end;
    //}
    //
    //info.length = info.end - info.start + 1;
    //
    //var code = 200;
    //var header = {
    //    "Cache-Control": "public; max-age=" + info.maxAge,
    //    Connection: "keep-alive",
    //    "Content-Type": info.mime,
    //    "Content-Disposition": "inline; filename=" + info.file + ";"
    //};
    //
    //if (info.rangeRequest) {                // Partial http response
    //    code = 206;
    //    header.Status = "206 Partial Content";
    //    header["Accept-Ranges"] = "bytes";
    //    header["Content-Range"] = "bytes " + info.start + "-" + info.end + "/" + info.size;
    //}
    //
    //header.Pragma = "public";
    //header["Last-Modified"] = info.modified.toUTCString();
    //header["Content-Transfer-Encoding"] = "binary";
    //header["Content-Length"] = info.length;
    //header.Server = info.server;
    //
    //resp.writeHead(code, header);
    //
    //stream = fs.createReadStream(info.path, { flags: "r", start: info.start, end: info.end });
    //stream.pipe(resp);
    //return true;
};

var isNumber = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);        // http://stackoverflow.com/a/1830844/648802
};



//module.exports = app;
