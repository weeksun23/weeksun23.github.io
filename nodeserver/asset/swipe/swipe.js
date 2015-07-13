//swipe插件by linyz 2015-07-11
(function(){
	"use strict";
	//帮助方法 全局变量
	function extend(obj,opts){
		opts = opts || {};
		for(var i in opts){
			obj[i] = opts[i];
		}
		return obj;
	}
	var support = (function(){
		var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;
		var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
		var isMobile = deviceIsAndroid || deviceIsIOS;
		return {
			deviceIsAndroid : deviceIsAndroid,
			deviceIsIOS : deviceIsIOS,
			isMobile : isMobile,
			touchEventNames : isMobile ? ["touchstart","touchmove","touchend","touchcancel"] : ["mousedown","mousemove","mouseup",""],
			transitionend : (function(){
				var el = document.createElement('div');
				var transEndEventNames = {
					WebkitTransition: 'webkitTransitionEnd',
					MozTransition: 'transitionend',
					OTransition: 'oTransitionEnd otransitionend',
					transition: 'transitionend'
				};
				for (var name in transEndEventNames) {
					if (el.style[name] !== undefined) {
						return transEndEventNames[name];
					}
				}
				return false;
			})(),
			transformName : 'transform' in document.documentElement.style ? 'transform' : 'webkitTransform'
		};
	})();
	//核心代码
	function Swipe(el,options){
		this.el = typeof el == 'string' ? document.querySelector(el) : el;
		this.options = extend({
			direction : "y"
		},options);
		this.init();
	}
	extend(Swipe,{
		getPos : function(e){
			if(support.isMobile){
				var touch = e.changedTouches[0];
				return {
					x : touch.pageX,
					y : touch.pageY
				};
			}else{
				return {
					x : e.pageX,
					y : e.pageY
				};
			}
		},
		timeInterval : 400,
		swipeDistance : 30,
		hasParentNode : function(el,validate){
			var p = el.parentNode;
			
		}
	});
	Swipe.prototype = {
		//获取元素当前的translate值
		getTranslate : function(){
			var transform = this.el.style[support.transformName];
	        if(!transform){
	        	return 0;
	        }
	        var match = transform.match(/\(.*\)/);
	        var str = match[0];
	        str = str.substring(1,str.length - 1);
	        var match = str.split(",")[this.options.direction === 'y' ? 1 : 0].match(/\-?[0-9]+\.?[0-9]*/g);
	        return +match[0];
		},
		setTranslate : function(value){
			this.el.style[support.transformName] = this.options.direction === 'y' 
				? ('translate3d(0,'+value+'px,0)') : ('translate3d('+value+'px,0,0)');
		},
		setTranslateAnimate : function(value){
			this.el.classList.add("swipe-transition");
			this.setTranslate(value);
		},
		init : function(){
			var me = this;
			var swipeEl = this.el;
			var data = {
				itemLen : swipeEl.querySelectorAll(".swipe-item").length
			};
			swipeEl.classList.add("swipe-" + this.options.direction);
			swipeEl.querySelector(".swipe-inner").style[this.options.direction === 'y' ? "height" : "width"] = data.itemLen * 100 + "%";
			var curIndex = 0;
			function move(e){
				var ePos = Swipe.getPos(e);
				var sPos = data.startPos;
				var dd = ePos[me.options.direction] - sPos[me.options.direction];
				if((dd > 0 && curIndex === 0) || (dd < 0 && curIndex === data.itemLen - 1)){
					dd = dd / 2;
				}
				me.setTranslate(data.startD + dd);
			}
			function end(e){
				document.removeEventListener(support.touchEventNames[1],move);
				document.removeEventListener(support.touchEventNames[2],end);
				var endPos = Swipe.getPos(e);
				var dd = data.startPos[me.options.direction] - endPos[me.options.direction];
				var size = data.itemSize;
				if(+new Date - data.startTime > Swipe.timeInterval || Math.abs(dd) < Swipe.swipeDistance){
					if(Math.abs(dd) < size / 2){
						me.setTranslateAnimate(data.startD);
						return;
					}
				}
				if((curIndex === data.itemLen - 1 && dd > 0) || (curIndex === 0 && dd < 0)){
					me.setTranslateAnimate(data.startD);
				}else{
					if(dd > 0){
						me.setTranslateAnimate(-size * (curIndex + 1));
						curIndex++;
					}else{
						me.setTranslateAnimate(-size * (curIndex - 1));
						curIndex--;
					}
				}
			}
			document.addEventListener(support.touchEventNames[0],function(e){
				e.preventDefault();
				e.stopPropagation();
				data.startPos = Swipe.getPos(e);
				data.startD = me.getTranslate();
				data.startTime = +new Date;
				data.itemSize = me.options.direction === 'y' ? swipeEl.offsetHeight : swipeEl.offsetWidth;
				document.addEventListener(support.touchEventNames[1],move);
				document.addEventListener(support.touchEventNames[2],end);
			});
			swipeEl.addEventListener(support.transitionend,function(){
				if(this.classList.contains("swipe-transition")){
					this.classList.remove('swipe-transition');
				}
			});
		}
	};
	window.Swipe = Swipe;
})();