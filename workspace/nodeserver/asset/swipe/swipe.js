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
		this.swipeData = {};
		this.curIndex = 0;
		this.options = extend({
			//滑动方向
			direction : "y",
			//每次切换页后触发
			onChangeItem : function(inIndex,outIndex,inEl,inElInit,outEl){},
			//是否显示导航点
			dot : false,
			//导航点方向
			dotPosition : 'right',
			//是否自动播放
			autoPlay : false,
			//自动播放周期
			duration : 3000
		},options);
		this.transitioning = false;
		this.autoPlayInterval = null;
		this.itemLen = null;
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
			while(p && p.tagName && p.tagName.toLowerCase() !== 'body'){
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
	function toggleDot(el,index,isSel){
		var nav = getSwipeNav(el);
		var dots = nav.querySelectorAll(".swipe-nav-dot");
		var target = dots[index];
		if(isSel !== undefined){
			target.classList[isSel ? "add" : "remove"]("selected");
		}else{
			var sel = nav.querySelector(".selected");
			if(sel && sel !== target){
				sel.classList.remove("selected");
			}
			if(sel !== target){
				target.classList.add("selected");
			}
		}
	}
	function getSwipeNav(el){
		var chs = Swipe.getChildren(el);
		for(var i=0,ii;ii=chs[i++];){
			if(ii.classList.contains("swipe-nav")){
				return ii;
			}
		}
		return null;
	}
	var initTouchStart = false;
	Swipe.prototype = {
		constructor : Swipe,
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
			this.transitioning = true;
			this.el.querySelector(".swipe-inner").classList.add("swipe-transition");
			this.setTranslate(value);
		},
		_move : function(e){
			var ePos = Swipe.getPos(e);
			var swipeData = this.swipeData;
			var sPos = swipeData.startPos;
			var dd = ePos[this.options.direction] - sPos[this.options.direction];
			if((dd > 0 && this.curIndex === 0) || 
				(dd < 0 && this.curIndex === this.itemLen - 1)){
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
					this.goon();
					return;
				}
			}
			if((this.curIndex === this.itemLen - 1 && dd > 0) || (this.curIndex === 0 && dd < 0)){
				this.setTranslateAnimate(data.startD);
			}else{
				this._swipeTo(this.curIndex + (dd > 0 ? 1 : -1));
			}
			this.goon();
		},
		init : function(){
			var me = this;
			var swipeEl = this.el;
			swipeEl._swipe = this;
			swipeEl.classList.add("swipe-" + this.options.direction);
			//更新inner的size
			this.updateItemLen();
			swipeEl.querySelector(".swipe-inner").addEventListener(support.transitionend,function(e){
				me.transitioning = false;
				e.preventDefault();
				e.stopPropagation();
				if(this.classList.contains("swipe-transition")){
					this.classList.remove('swipe-transition');
				}
			});
			if(this.options.autoPlay){
				this._setAutoPlay(true);
			}
			if(!initTouchStart){
				initTouchStart = true;
				document.addEventListener(support.touchEventNames[0],function(e){
					var swipeEl = Swipe.hasParentNodeByCls(e.target,"swipe");
					if(!swipeEl){
						return;
					}
					var tagName = e.target.tagName.toLowerCase();
					if(!/^(embed|iframe|object|button|a)$/.test(tagName)){
						e.preventDefault();
						e.stopPropagation();
					}
					var _swipe = swipeEl._swipe;
					_swipe.pause();
					if(_swipe.transitioning) {
						swipeEl.querySelector(".swipe-inner").classList.remove("swipe-transition");
						_swipe.transitioning = false;
					}
					var data = _swipe.swipeData;
					data.startPos = Swipe.getPos(e);
					data.startD = _swipe.getTranslate();
					data.startTime = +new Date;
					_swipe.updateItemSize();
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
		},
		updateItemSize : function(){
			this.swipeData.itemSize = this.options.direction === 'y' ? this.el.offsetHeight : this.el.offsetWidth;
		},
		updateItemLen : function(){
			var newLen = Swipe.getChildren(this.el.querySelector(".swipe-inner")).length;
			if(this.itemLen === newLen) return;
			this.itemLen = newLen;
			this.el.querySelector(".swipe-inner").style[this.options.direction === 'y' ? "height" : "width"] = 
				this.itemLen * 100 + "%";
				//this.itemLen * (this.options.direction === 'y' ? this.el.offsetHeight : this.el.offsetWidth) + "px";
			if(this.options.dot){
				var len = this.itemLen;
				var html = [];
				for(var i=0;i<len;i++){
					html.push("<span class='swipe-nav-dot'></span>");
				}
				var el = this.el;
				var nav = getSwipeNav(el);
				if(nav){
					nav.innerHTML = html.join("");
				}else{
					nav = document.createElement("div");
					nav.className = "swipe-nav swipe-nav-" + this.options.dotPosition;
					nav.innerHTML = html.join("");
					el.appendChild(nav);
				}
				toggleDot(el,0,true);
			}
		},
		_swipeTo : function(i){
			var data = this.swipeData;
			var outIndex = this.curIndex;
			this.curIndex = i;
			this.setTranslateAnimate(-data.itemSize * i);
			var target = this.getItem(i);
			this.options.onChangeItem.call(this,i,outIndex,target,target._swipeInit,this.getItem(outIndex));
			target._swipeInit = true;
			if(this.options.dot){
				toggleDot(this.el,i);
			}
		},
		_setAutoPlay : function(isAutoPlay){
			if(isAutoPlay){
				var me = this;
				this.autoPlayInterval = setInterval(function(){
					if(!me.autoPlayInterval) return;
					var nxtIndex = me.curIndex + 1;
					if(nxtIndex === me.itemLen){
						nxtIndex = 0;
					}
					me.swipeTo(nxtIndex);
				},this.options.duration);
			}else{
				clearInterval(this.autoPlayInterval);
				this.autoPlayInterval = null;
			}
		},
		/*方法*/
		//设置是否自动播放
		setAutoPlay : function(isAutoPlay){
			this._setAutoPlay(this.options.autoPlay = isAutoPlay);
		},
		//暂停自动播放
		pause : function(){
			if(this.options.autoPlay){
				this._setAutoPlay(false);
			}
		},
		//继续自动播放
		goon : function(){
			if(this.options.autoPlay){
				this._setAutoPlay(true);
			}
		},
		//根据页索引滑动到目标页
		swipeTo : function(i){
			this.updateItemSize();
			this._swipeTo(i);
		},
		//重新调整尺寸
		resize : function(){
			this.updateItemSize();
			this.setTranslate(-this.swipeData.itemSize * this.curIndex);
		},
		//更新页数量 并调整尺寸
		update : function(){
			this.updateItemLen();
			this.resize();
		},
		getItem : function(i){
			if(i === undefined){
				i = this.curIndex;
			}
			var items = Swipe.getChildren(this.el.querySelector(".swipe-inner"));
			return items[i];
		}
	};
	window.Swipe = Swipe;
})();