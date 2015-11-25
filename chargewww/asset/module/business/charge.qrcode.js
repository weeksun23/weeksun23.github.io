define(['avalon'],function(avalon){
	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    function QrcodeScanner(element,success,error,videoError){
    	this.element = element;
    	this.scanTime = 1000;
    	this.scanInter = null;
    	this.error = function(){};
    	this.success = function(){};
    	this.videoError = function(){};
    	this.stream = null;
    }
    QrcodeScanner.prototype.scan = function(){
    	var me = this;
    	var context = me.canvas.getContext('2d');
    	if (me.localMediaStream) {
            context.drawImage(video, 0, 0, 307, 250);
            try {
                qrcode.decode();
            } catch (e) {
                me.error(e, me.localMediaStream);
                me.scanInter = setTimeout(me.scan, me.scanTime);
            }
        } else {
        	me.scanInter = setTimeout(me.scan, me.scanTime);
        }
    };
    QrcodeScanner.prototype.init = function(){
    	var me = this;
    	var currentElem = $(this.element);
		var height = currentElem.height();
        var width = currentElem.width();
		this.element.innerHTML = '<video width="' + width + 'px" height="' + height + 'px"></video>' + 
    		'<canvas id="qr-canvas" width="' + (width - 2) + 'px" height="' + (height - 2) + 'px" style="display:none;"></canvas>';
		var video = this.video = this.element.querySelector("video");
        var canvas = this.canvas = this.element.querySelector("canvas");
        var context = canvas.getContext('2d');

        var successCallback = function(stream) {
            video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
            me.localMediaStream = stream;
            video.play();
            setTimeout(me.scan, me.scanTime);
        };

        // Call the getUserMedia method with our callback functions
        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: true}, successCallback, function(error) {
                me.videoError(error, me.localMediaStream);
            });
        } else {
        	me.videoError(null, me.localMediaStream);
        }

        qrcode.callback = function (result) {
        	me.success(result, me.localMediaStream);
        };
    };
    QrcodeScanner.prototype.stop = function(){
    	clearTimeout(this.scanInter);
    	this.video.pause();
    	this.element.innerHTML = '';
    };
    return QrcodeScanner;
});