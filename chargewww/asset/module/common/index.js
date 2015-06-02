define(["common/websocket","common/dialog/avalon.dialog"],function(websocket){
	//获取所有子元素，非文本节点
	avalon.fn.children = function(){
		var children = [];
		avalon.each(this[0].childNodes,function(i,node){
			node.nodeType === 1 && children.push(node);
		});
		return children;
	};
	avalon.fn.loading = function(isEnd){
		var children = this.children();
		var target;
		avalon.each(children,function(i,el){
			if(avalon(el).hasClass("mloading")){
				target = el;
				return false;
			}
		});
		var key = "data-loading-num";
		if(isEnd){
			if(!target) return;
			var num = +target.getAttribute(key);
			if(--num === 0){
				target.parentNode.removeChild(target);
			}else{
				target.setAttribute(key,num);
			}
		}else{
			if(target){
				var num = +target.getAttribute(key);
				target.setAttribute(key,++num);
			}else{
				var div = document.createElement("div");
				div.className = "mloading";
				div.setAttribute(key,'1');
				div.innerHTML = "<div><i class='glyphicon glyphicon-refresh spin'></i></div>";
				this[0].appendChild(div);
			}
		}
	};
	avalon.support = {
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
		})()
	};
	var body = avalon.define({
		$id : "body",
		curPage : null,
		$personalWinOpts : {
			title : "个人信息"
		}
	});
	var top = avalon.define({
		$id : "top",
		navCollapse : true,
		curIndex : -1,
		toggleNav : function(){
			top.navCollapse = !top.navCollapse;
		},
		showPersonalWin : function(){
			avalon.vmodels.$personalWin.open();
		}
	});
	return {
		top : top,
		body : body,
		noCarImgSrc : "image/no-car.png",
		getDateTimePickerOpts : function(){
			return {
				language:  'zh-CN',
			    format : "yyyy-mm-dd hh:ii:ss",
			    weekStart: 1,
			    todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2
			};
		},
		initDatePickerToVM : function($picker,vmodel,key){
			if(!$picker.data("datetimepicker")){
				$picker.datetimepicker(this.getDateTimePickerOpts());
			}
			$picker.on("changeDate",function(ev){
				vmodel[key] = ev.date ? ev.date.getTime() : null;
			});
		},
		websocket : websocket,
		getCarType : function(type){
			if(type === "0"){
				return "未知";
			}else if(type === '1'){
				return "临时车";
			}else if(type === "2"){
				return "本地VIP";
			}
		}
	};
});