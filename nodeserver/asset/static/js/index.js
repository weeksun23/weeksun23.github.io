(function(){
	var Tap = (function(){
		var activeClass = "click-active";
		var dragDistance = 30;
		var clickDuration = 750;
		var inter = 100;
		var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;
		var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
		var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;
		var isMobile = deviceIsAndroid || deviceIsIOS || deviceIsBlackBerry10;
		if(isMobile){
			var eventNames = ["touchstart","touchmove","touchend","touchcancel"];
		}else{
			eventNames = ["mousedown","mousemove","mouseup",""];
		}
		function getPos(e){
			if(isMobile){
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
		}
		return {
			on : function(el,param){
				var clickFn,start,end,longClickFunc,activeClassEl,_start,_move,_end;
				if(typeof param == 'function'){
					clickFn = param;
					activeClassEl = el;
				}else{
					param = param || {};
					clickFn = param.clickFn;
					start = param.start;
					end = param.end;
					_start = param._start;
					_move = param._move;
					_end = param._end;
					longClickFunc = param.longClickFunc;
					activeClassEl = param.activeClassEl || el;
				}
		    	var t = {};
		    	var interval;
		    	el.addEventListener(eventNames[0],function(e){
		    		_start && _start.call(this,e);
		    		var time = 0;
		    		var me = this;
		    		t.isTrigger = true;
		    		t.startTime = e.timeStamp;
		    		t.startPos = getPos(e);
		    		activeClassEl.classList.add(activeClass);
		    		if(longClickFunc){
		    			interval = setInterval(function(){
							time += inter;
							if(time >= clickDuration){
								end && end.call(me,e);
								clearInterval(interval);
								longClickFunc.call(me,e);
							}
						},inter);
		    		}
		    		start && start.call(this,e);
		    	});
		    	el.addEventListener(eventNames[1],function(e){
		    		_move && _move.call(this,e);
		    		if(!t.isTrigger) return;
		    		var pos = getPos(e);
		    		var startPos = t.startPos;
		    		if (Math.abs(pos.x - startPos.x) > dragDistance || 
		    			Math.abs(pos.y - startPos.y) > dragDistance) {
		    			activeClassEl.classList.remove(activeClass);
						t.isTrigger = false;
						longClickFunc && clearInterval(interval);
					}
		    	});
		    	el.addEventListener(eventNames[2],function(e){
		    		_end && _end.call(this,e);
		    		if(!t.isTrigger) return;
		    		if(e.timeStamp - t.startTime > clickDuration){
		    			t.isTrigger = false;
		    		}else{
		    			clickFn && clickFn.call(this,e);
		    		}
		    		activeClassEl.classList.remove(activeClass);
		    		end && end.call(this,e);
		    		longClickFunc && clearInterval(interval);
		    	});
		    	eventNames[3] && el.addEventListener(eventNames[3],function(e){
		    		if(!t.isTrigger) return;
		    		t.isTrigger = false;
		    		activeClassEl.classList.remove(activeClass);
		    		longClickFunc && clearInterval(interval);
		    	});
			}
		};
	})();
	function each(arr,func){
		for(var i=0,ii=arr.length;i<ii;i++){
			func(arr[i],i);
		}
	}
	function $(sel,el){
		return (el || document).querySelector(sel);
	}
	function $$(sel,el){
		return (el || document).querySelectorAll(sel);
	}
	(function(){
		var tpl = "<li class='list-item db dbac' data-href='${href}'>" +
			"<div class='list-center dbf1'>${title}</div>" +
			"<div class='list-right'><img width='10' src='image/arrow.png' alt=''/></div>" +
		"</li>";
		var html = [];
		for(var i=0,ii;ii=indexdata[i++];){
			html.push(tpl.replace("${href}",ii.href).replace("${title}",ii.title));
		}
		var listEl = $("#list");
		listEl.innerHTML = html.join("");
		//绑定点击切换页面事件
		each($$("li.list-item",listEl),function(el){
			Tap.on(el,function(){
				var href = this.getAttribute("data-href");
				if(href){
					location.href = href + ".html";
				}
			});
		});
	})();
})();