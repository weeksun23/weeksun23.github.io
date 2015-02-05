(function($){
	"use strict";
	var methods = {
		//获取所选的value
		getValue : function(){
			var scroll = this.data("scroll");
			var options = this.data('options');
			var index = parseInt(Math.abs(scroll.y) / options.tickH);
			var sel = options.data[index];
			return sel ? sel[options.valueField] : null;
		},
		setValue : function(value){
			var options = this.data('options');
			var data = options.data;
			for(var i=0,ii=data.length;i<ii;i++){
				if(data[i][options.valueField] === value){
					this.data('scroll').scrollTo(0,-i * options.tickH,200);
					return this;
				}
			}
			return this;
		},
		loadData : function(data){
			var options = this.data('options');
			options.data = data || [];
			this.data("scroll").destroy();
			initHtml.call(this,options);
			return this;
		}
	};
	function getDataHtml(options){
		var data = options.data;
		var vF = options.valueField;
		var tF = options.textField;
		var extra = new Array((options.scaleNum - 1) / 2 + 1).join("<li class='pick-list-item vbh'>a</li>");
		var html = [extra];
		for(var i=0,item;item=data[i++];){
			html.push("<li class='pick-list-item' data-value='"+item[vF]+"'><span>"+item[tF]+"</span></li>");
		}
		html.push(extra);
		return html.join("");
	}
	function initHtml(options){
		//生成结构
		this.addClass("pick").html("<ul class='pick-list'>"+getDataHtml(options)+"</ul>"+
			"<div class='pick-top pick-mask'></div><div class='pick-bottom pick-mask'></div>"+
			"<div class='pick-center'><i></i><span>1</span><i class='pick-unit'></i></div>");
		var scaleNum = options.scaleNum;
		var h = this.height();
		var tickH = h / scaleNum;
		options.tickH = Math.round(tickH);
		var tickHeightPercent = 1 / scaleNum * 100;
		var maskHeightPercent = (tickHeightPercent * (scaleNum - 1) / 2) + "%";
		tickHeightPercent += "%";
		//初始化结构
		this.data("options",options).children("div.pick-mask").css("height",maskHeightPercent);
		var $item = this.find("li.pick-list-item").css({
			height : tickHeightPercent,
			'line-height' : tickH + 'px'
		});
		var $center = this.children("div.pick-center");
		if(options.unit){
			//处理单位
			var maxW = 0;
			$item.each(function(){
				var $span = $(this).children("span");
				if($span.length > 0){
					var w = $span.width();
					if(w > maxW) maxW = w;
				}
			});
			$center.css({
				top : maskHeightPercent,
				height : tickHeightPercent,
				'line-height' : tickH + 'px'
			}).children("span").width(maxW);
			$center.children("i").text(options.unit);
		}else{
			$center.remove();
		}
		initScroll.call(this,options);
	}
	function initScroll(options){
		var scroll = new IScroll(this.get(0));
		this.data("scroll",scroll);
		var me = this;
		var isTriggerOnPick = false;
        scroll.on("scrollEnd",function(){
        	var tickH = options.tickH;
    		var y = Math.abs(this.y);
    		var d = y % tickH;
            if(d === 0) {
            	options.onPick && options.onPick.call(me,options.data[parseInt(y / tickH)]);
            	return;
            };
            isTriggerOnPick = true;
            this.scrollTo(0,-Math.round(y / tickH) * tickH,200);
        });
        scroll.on("scrollStart",function(){
        	isTriggerOnPick = false;
        });
	}
	/*
	要求目标区域必须没有padding，且height必须是scaleNum的倍数
	*/
	$.fn.pick = function(options){
		var me = this;
		if(typeof options == 'object'){
			options = $.extend({
				valueField : "value",
				textField : "text",
				//选项数据
				data : [],
				//刻度数目,必须为奇数，>=3
                scaleNum : 5,
                //选择后触发事件
                onPick : null,
                //单位信息
                unit : null
			},options);
			initHtml.call(this,options);
			return this;
		}else{
			return methods[options].apply(this,[].slice.call(arguments,1));
		}
	};
})($);