(function(){
    'use strict';

    var codecString = '';
    /**
     *  Set to whatever codec you are using
     */

 codecString = 'video/mp4; codecs="avc1.42C028"';
//    codecString = 'video/webm; codecs="vp8"';
// codecString = 'video/webm; codecs="vp9"';



    var video = document.getElementById('video');
    var mediaSource = new MediaSource();
    video.src = window.URL.createObjectURL(mediaSource);
    var buffer = null;
    var queue = [];

    var bufferArray = [];

    function updateBuffer(){
        if (queue.length > 0 && !buffer.updating) {
            buffer.appendBuffer(queue.shift());
        }
    }

    /**
     * Mediasource
     */
    function sourceBufferHandle(){
        buffer = mediaSource.addSourceBuffer(codecString);
        buffer.mode = 'sequence';

        buffer.addEventListener('update', function() { // Note: Have tried 'updateend'
            updateBuffer();
        });

        buffer.addEventListener('updateend', function() {
            updateBuffer();
            //video.play();
        });

        initWS();
    }

    mediaSource.addEventListener('sourceopen', sourceBufferHandle)

    function initWS(){
        var ws = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port, 'echo-protocol');
        console.log(ws)
        ws.binaryType = "arraybuffer";

        ws.onopen = function(){
            console.info('WebSocket connection initialized');
        };

        ws.onmessage = function (event) {
            //console.info('Recived WS message.', event);
            //console.log(event)
            if(typeof event.data === 'object'){
                if (buffer.updating || queue.length > 0) {
                    queue.push(event.data);
                } else {
                    console.log(buffer.updating)
                    console.log(queue.length)
                    buffer.appendBuffer(event.data);
                    video.play();
                }
            }
        };

        //ws.onmessage = function (event) {
        //    var data =  event.data;
        //    console.log( data)
        //    var datalen = event.data.byteLength;
        //
        //    var reader = new FileReader();
        //
        //    reader.onload = function(evt) {
        //        if(evt.target.readyState == FileReader.DONE) {
        //            var data = new Uint8Array(evt.target.result);
        //            //方式2 ok
        //            video.src = window.URL.createObjectURL(getBlob(data));
        //        }
        //    }
        //    reader.readAsArrayBuffer(data);
        //};

    }

    function getBlob2(data, len){
        var buffer = new ArrayBuffer(len);
        var dataview = new DataView(buffer);
        writeUint8Array(dataview,0,data,len);
        return new Blob([dataview], { type: 'audio/wav' });

    }

    function getBlob(data){
        //var buffer = new ArrayBuffer(len);
        var dataview = new DataView(data);
        //writeUint8Array(dataview,0,data,len);
        return new Blob([dataview], { type: 'video/mp4' });

    }


})();