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
		this.swipeData = {
			itemLen : Swipe.getChildren(this.el.querySelector(".swipe-inner")).length,
			curIndex : 0
		};
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
		hasParentNodeByCls : function(el,cls){
			if(el.tagName.toLowerCase() === 'body'){
				return el.classList.contains(cls) ? el : false;
			}
			var p = el.parentNode;
			while(p.tagName.toLowerCase() !== 'body'){
				if(p.classList.contains(cls)) return p;
				p = p.parentNode;
			}
			return false;
		},
		getChildren : function(el){
			var children = [];
			var nodes = el.childNodes;
			for(var i=0,ii;ii=nodes[i++];){
				ii.nodeType === 1 && children.push(ii);
			}
			return children;
		}
	});
	var swipeNum = 0;
	Swipe.prototype = {
		//获取元素当前的translate值
		getTranslate : function(){
			var transform = this.el.querySelector(".swipe-inner").style[support.transformName];
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
			this.el.querySelector(".swipe-inner").style[support.transformName] = this.options.direction === 'y' 
				? ('translate3d(0,'+value+'px,0)') : ('translate3d('+value+'px,0,0)');
		},
		setTranslateAnimate : function(value){
			this.el.querySelector(".swipe-inner").classList.add("swipe-transition");
			this.setTranslate(value);
		},
		_move : function(e){
			var ePos = Swipe.getPos(e);
			var swipeData = this.swipeData;
			var sPos = swipeData.startPos;
			var dd = ePos[this.options.direction] - sPos[this.options.direction];
			if((dd > 0 && swipeData.curIndex === 0) || 
				(dd < 0 && swipeData.curIndex === swipeData.itemLen - 1)){
				dd = dd / 2;
			}
			this.setTranslate(swipeData.startD + dd);
		},
		_end : function(e){
			var endPos = Swipe.getPos(e);
			var data = this.swipeData;
			var dd = data.startPos[this.options.direction] - endPos[this.options.direction];
			var size = data.itemSize;
			if(+new Date - data.startTime > Swipe.timeInterval || Math.abs(dd) < Swipe.swipeDistance){
				if(Math.abs(dd) < size / 2){
					this.setTranslateAnimate(data.startD);
					return;
				}
			}
			if((data.curIndex === data.itemLen - 1 && dd > 0) || (data.curIndex === 0 && dd < 0)){
				this.setTranslateAnimate(data.startD);
			}else{
				if(dd > 0){
					this.setTranslateAnimate(-size * (data.curIndex + 1));
					data.curIndex++;
				}else{
					this.setTranslateAnimate(-size * (data.curIndex - 1));
					data.curIndex--;
				}
			}
		},
		init : function(){
			var me = this;
			var swipeEl = this.el;
			swipeEl._swipe = this;
			swipeEl.classList.add("swipe-" + this.options.direction);
			var swipeInner = swipeEl.querySelector(".swipe-inner");
			swipeInner.style[this.options.direction === 'y' ? "height" : "width"] = 
				this.swipeData.itemLen * 100 + "%";
			swipeInner.addEventListener(support.transitionend,function(){
				if(this.classList.contains("swipe-transition")){
					this.classList.remove('swipe-transition');
				}
			});
			if(swipeNum === 0){
				document.addEventListener(support.touchEventNames[0],function(e){
					var swipeEl = Swipe.hasParentNodeByCls(e.target,"swipe");
					if(!swipeEl){
						return;
					}
					e.preventDefault();
					e.stopPropagation();
					var _swipe = swipeEl._swipe;
					var data = _swipe.swipeData;
					data.startPos = Swipe.getPos(e);
					data.startD = _swipe.getTranslate();
					data.startTime = +new Date;
					data.itemSize = _swipe.options.direction === 'y' ? swipeEl.offsetHeight : swipeEl.offsetWidth;
					function move(e){
						_swipe._move(e);
					}
					function end(e){
						document.removeEventListener(support.touchEventNames[1],move);
						document.removeEventListener(support.touchEventNames[2],end);
						_swipe._end(e);
					}
					document.addEventListener(support.touchEventNames[1],move);
					document.addEventListener(support.touchEventNames[2],end);
				});
			}
			swipeNum++;
		}
	};
	window.Swipe = Swipe;
})();