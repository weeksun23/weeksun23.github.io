/*
*/
define(['avalon'],function(avalon){
    'use strict';
	var transformName = 'transform' in document.documentElement.style ? 'transform' : 'webkitTransform';
    var numReg = /\-?[0-9]+\.?[0-9]*/g;
    function getTranslateX(el){
        var transform = el.style[transformName];
        var match = transform.match(numReg);
        return +match[0];
    }
    function setTranslateX(el,x){
        el.style[transformName] = 'translateX('+x+'px)';
    }
    function dealTranslateEnd(el,x){
        if(x === 0){
            el.querySelector(".list-item-del").classList.add('hide');
            if(this.curSlideItem === el){
                this.curSlideItem = null;
            }
        }else{
            this.curSlideItem = el;
        }
    }
	/*
    实例后提供滑动item所需的start move end事件函数
    目前只支持向左滑
	*/
	function SlideItem(options){
        this.options = avalon.mix({
            //滑动后要显示的元素的选择器
            targetSelector : ''
        },options);
        //当前滑动的元素
		this.curSlideItem = null;
	}
    SlideItem.prototype.setTranslateXAnimate = function(el,x,start,func){
        var me = this;
        if(start === undefined){
            start = getTranslateX(el);
        }
        if(x === start) {
            dealTranslateEnd.call(this,el,x);
            return;
        }
        if(x > start){
            var d = 2;
        }else{
            d = -2;
        }
        el.$animating = true;
        var interval = setInterval(function(){
            start += d;
            if(d > 0){
                if(start > x){
                    start = x;
                }
            }else{
                if(start < x){
                    start = x;
                }
            }
            setTranslateX(el,start);
            if(start === x){
                clearInterval(interval);
                el.$animating = false;
                dealTranslateEnd.call(me,el,x);
                func && func.call(el,x);
            }
        });
    };
    function getTouchPos(e){
        var touch = e.changedTouches[0];
        return {
            x : touch.pageX,
            y : touch.pageY
        };
    }
	SlideItem.prototype.getEventObj = function(el){
		var me = this;
		var data = {};
		return {
			start : function(e){
                if(el.$animating) return;
                if(me.curSlideItem && me.curSlideItem !== el){
                    me.setTranslateXAnimate(me.curSlideItem,0);
                }
            	data.touchstart = getTouchPos(e);
            	data.posstart = getTranslateX(el);
                var del = el.querySelector(me.options.targetSelector);
            	del.classList.remove('hide');
                data.targetWidth = avalon(del.querySelector("div")).width();
            },
            move : function(e){
                if(el.$animating) return;
            	var touch = getTouchPos(e);
            	var moved = touch.x - data.touchstart.x;
            	var curPos = data.posstart + moved;
            	if(curPos < -data.targetWidth){
            		curPos = -data.targetWidth;
            	}else if(curPos > 0){
            		curPos = 0;
            	}
            	setTranslateX(el,curPos);
            },
            end : function(){
                if(el.$animating) return;
                var x = getTranslateX(el);
                if(Math.abs(x) > data.targetWidth / 2){
                    var target = -data.targetWidth;
                }else{
                    target = 0;
                }
                me.setTranslateXAnimate(el,target,x);
            }
		};
	};
	return SlideItem;
});