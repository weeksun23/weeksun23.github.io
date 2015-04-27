/*
	移动端选择插件
*/
define(["avalon",'lib/iscroll/iscroll-lite',"css!./avalon.pick.css"],function(avalon,IScroll){
	//根据data生成html
	var tpl = 
		"<ul class='pick-list'>"+
			"{{extra | html}}" +
			"<li class='pick-list-item' ms-repeat='data' ms-css-line-height='tickHeight'>" +
				"<span class='pick-list-text'>{{el[textField]}}</span>"+
			"</li>" +
			"{{extra | html}}" +
		"</ul>"+
		"<div class='pick-top pick-mask' ms-css-height='maskHeightPercent'></div>"+
		"<div class='pick-bottom pick-mask' ms-css-height='maskHeightPercent'></div>"+
		"<div ms-if='unit' class='pick-center' ms-css-line-height='tickHeight' ms-css-top='maskHeightPercent' ms-css-bottom='maskHeightPercent'>"+
			"<i>{{unit}}</i><span class='pick-unit-mid'>1</span><i class='pick-unit'>{{unit}}</i>"+
		"</div>";
	function getFixHeight(h,scaleNum){
		return h - h % scaleNum;
	}
	var widget = avalon.ui.pick = function(element, data, vmodels){
		var options = data.pickOptions;
		//上下占位
		options.extra = new Array((options.scaleNum - 1) / 2 + 1).join("<li class='pick-list-item vbh' ms-css-line-height='tickHeight'>a</li>");
		//计算每一块的高度 并根据实际情况修正element高度
		options.tickH = (function(){
			var h = avalon(element).height();
			var scaleNum = options.scaleNum;
			var newH = getFixHeight(h,scaleNum);
			if(h !== newH){
				element.style.height = newH + 'px';
			}
			return newH / scaleNum;
		})();
		options.tickHeight = options.tickH + "px";
		//上下遮罩百分比高度
		options.maskHeightPercent = (1 / options.scaleNum * 100 * (options.scaleNum - 1) / 2) + "%";
		var scroll;
		var vmodel = avalon.define(data.pickId,function(vm){
			avalon.mix(vm,options);
			vm.widgetElement = element;
			vm.$skipArray = ['widgetElement','setValue','getValue','tickH'];
			vm.$init = function(){
				var $el = avalon(element);
				$el.addClass('pick');
				element.innerHTML = tpl;
				avalon.scan(element, vmodel);
				if(vmodel.unit){
					var maxW = 0;
					avalon.each(element.querySelectorAll("span.pick-list-text"),function(i,span){
						var w = avalon(span).width();
						if(w > maxW){
							maxW = w;
						}
					});
					element.querySelector("span.pick-unit-mid").style.width = maxW + 'px';
				}
				scroll = new IScroll(element);
	            scroll.on("scrollEnd",function(){
	        		var y = Math.abs(this.y);
	        		var tickH = vmodel.tickH;
	        		var d = y % tickH;
	                if(d === 0) {
	                	vmodel.onPick && vmodel.onPick.call(me);
	                	return;
	                };
	                var target = Math.round(y / tickH) * tickH;
	                var distance = Math.abs(y - target);
	                var maxTime = 300;
	                var half = tickH / 2;
	                if(distance >= half){
	                	var time = maxTime;
	                }else{
	                	time = parseInt(distance / half * maxTime);
	                }
	                this.scrollTo(0,-target,time);
	            });
			};
			vm.$remove = function(){
				element.innerHTML = element.textContent = "";
			};
			vm.getValue = function(){
				var index = parseInt(Math.abs(scroll.y) / vmodel.tickH);
				var sel = vmodel.data[index];
				return sel ? sel[vmodel.valueField] : null;
			};
			vm.setValue = function(value){
				var data = vmodel.data;
				for(var i=0,ii=data.length;i<ii;i++){
					if(data[i][vmodel.valueField] === value){
						scroll.scrollTo(0,-i * vmodel.tickH,200);
						return this;
					}
				}
				return this;
			};
			//重新调整高度
			vm.resize = function(height){
				height = getFixHeight(height,vmodel.scaleNum);
				element.style.height = height + 'px';
				vmodel.tickH = height / vmodel.scaleNum;
				vmodel.tickHeight = vmodel.tickH + "px";
				scroll.refresh();
			}
		});
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
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
	};
});