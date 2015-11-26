define(function(require, exports, module){
	"use strict";
	require("./mousewheel");
	seajs.importStyle(
		".jscroll{border: 1px solid #d2d2d2;position: relative;opacity: 0.5}" +
		".jscroll-nosel{-moz-user-select:none;-webkit-user-select:none;user-select:none;}"+
		".jscroll:hover{opacity: 1}" +
		".jscroll div{background-color: #888;position: absolute;}" +
		".jscroll-y div{top: 0;left: 0;right: 0;}"
	);
	function getObj(position,$slide){
		if(position === 'y'){
			var cssPosition = 'top';
			var cssScroll = 'scrollTop';
			var outerCssSize = 'outerHeight';
			var cssSize = 'height';
		}else{
			cssPosition = 'left';
			cssScroll = 'scrollLeft';
			outerCssSize = 'outerWidth';
			cssSize = 'width';
		}
		if($slide){
			var $parent = $slide.parent();
			var scrollSize = $parent[cssSize]();
			//获取最大移动范围
			var max = scrollSize - $slide[cssSize]();
		}
		return {
			scrollSize : scrollSize,
			max : max,
			cssPosition : cssPosition,
			cssScroll : cssScroll,
			outerCssSize : outerCssSize,
			cssSize : cssSize,
			position : position.toUpperCase()
		};
	}
	function triggerSelection(isOff){
		var body = document.body;
		if(isOff){
			if(body.onselectstart){
				body.onselectstart = new Function("return false;"); 
			}else{
				$("body").addClass("jscroll-nosel");
			}
		}else{
			if(body.onselectstart){
				body.onselectstart = new Function("return true;"); 
			}else{
				$("body").removeClass("jscroll-nosel");
			}
		}
	}
	function bindSlide($slide){
		$slide.on('mousedown',function(e){
			triggerSelection(true);
			var $slide = $(this);
			var options = $slide.data("options");
			var obj = getObj(options.position,$slide);
			//鼠标起始的pageX或pageY值
			var start = e["page" + obj.position];
			//起始的left 或 top值
			var positionVal = parseInt($slide.css(obj.cssPosition) || 0,10);
			//目标区域
			var $target = $(options.targetSelector);
			var targetScrollSize = $target.children('div')[obj.outerCssSize]();
			//目标区域起始scroll值
			var sScrollVal = $target[obj.cssScroll]();
			$(document).on("mousemove.jscrollSlide",function(moveE){
				//鼠标移动距离
				var distance = moveE["page" + obj.position] - start;
				var result = positionVal + distance;
				if(result < 0){
					result = 0;
				}else if(result > obj.max){
					result = obj.max;
				}
				$slide.css(obj.cssPosition,result);
				var scrollDistance = targetScrollSize * (distance / obj.scrollSize);
				$target[obj.cssScroll](sScrollVal + scrollDistance);
			}).on("mouseup.jscrollSlide",function(){
				triggerSelection(false);
				$(document).off("mousemove.jscrollSlide")
					.off("mouseup.jscrollSlide");
			});
		});
	}
	function moveSlide($slide,distance){
		var options = $slide.data("options");
		var obj = getObj(options.position,$slide);
		if(distance < 0){
			distance = 0;
		}else if(distance > obj.max){
			distance = obj.max;
		}
		$slide.css(obj.cssPosition,distance);
	}
	function setSlideSize($slide,$target,options){
		var obj = getObj(options.position);
		var $this = $slide.parent();
		var H = $target[obj.cssSize]();
		var h = $target.children("div")[obj.outerCssSize](true);
		if(h <= H){
			//内容没有溢出
			$this.hide();
			return;
		}else{
			$this.show();
			var a = H / h;
			$slide[obj.cssSize]($this[obj.cssSize]() * a);
		}
		var scroll = $target[obj.cssScroll]();
		moveSlide($slide,getSlideScroll(scroll,$target,$slide,obj));
	}
	//目标区域的scroll与slide滑块区域的scroll之间的转换
	//返回转换后的结果
	function getSlideScroll(targetScroll,$target,$slide,obj){
		if(targetScroll === 0) return 0;
		return targetScroll / $target.children("div")[obj.outerCssSize]() 
			* $slide.parent()[obj.cssSize]();
	}
	var methods = {
		resize : function(){
			var $slide = $(this).children("div");
			var options = $slide.data('options');
			var $target = $(options.targetSelector);
			setSlideSize($slide,$target,options);
		}
	};
	//$this $slide $target
	$.fn.jscroll = function(options){
		options = options || {};
		var $this = $(this);
		if(typeof options == 'object'){
			options = $.extend({
				//x或y
				position : 'y',
				targetSelector : null
			},options);
			if(!options.targetSelector){
				$.error("未定义targetSelector");
			}
			//生成滑块
			var $slide = $("<div />").appendTo($this.addClass("jscroll jscroll-" + options.position));
			//绑定滑块滑动事件
			bindSlide($slide);
			var $target = $(options.targetSelector);
			//绑定区域滚轮事件
			$target.on("mousewheel",function(e){
				var obj = getObj(options.position);
				var deltaY = e.deltaY;
				if(deltaY > 0){
					//向上滚
					var d = -20;
				}else{
					//向下滚
					d = 20;
				}
				var $target = $(this);
				var start = $target[obj.cssScroll]();
				$target[obj.cssScroll](start + d);
				var end = $target[obj.cssScroll]();
				if(start === end) return;
				moveSlide($slide,getSlideScroll(end,$target,$slide,obj));
			});
			$slide.data('options',options);
			setSlideSize($slide,$target,options);
		}else{
			methods[options].call(this);
		}
		return $this;
	};
});