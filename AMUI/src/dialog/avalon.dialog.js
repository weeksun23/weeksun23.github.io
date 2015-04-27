define(["avalon","css!./avalon.dialog.css"],function(avalon){
	//所有dialog 共享的mask层
	var mask;
	var maskZIndex = 99;
	var templete = 
		"<div class='dialog-title' ms-if='title'>{{title | html}}</div>" +
    	"<div class='dialog-content' ms-class='{{contentCls}}'>{{content | html}}</div>"+
    	"<div class='dialog-oper db dbac'>"+
    		"<div ms-repeat='buttons' class='dbf1'><a class='dialog-btn' href='javascript:void(0)' ms-on-tap='$doOper(el)'>{{el.text}}</a></div>" +
    	"</div>";
    var lanObj = {
		zh : {
			cancel : "取消",
			ok : "确定",
			confirm : "确认信息"
		},
		en : {
			cancel : "cancel",
			ok : 'ok',
			confirm : "confirm message"
		}
	};
	//初始化confirm alert窗口的buttons
	function initMesWinBtn(options){
		var type = options.type;
		if(type !== 'normal'){
			var lan = lanObj[options.lan];
			options.buttons = [{
				text : lan.ok,
				type : 'ok'
			}];
			if(type === 'confirm'){
				options.buttons = [{
					text : lan.cancel,
					type : 'cancel'
				}].concat(options.buttons);
			}
		}
	}
	function dealCurDialogs(target,isShow){
		//处理已经打开过的dialog
		var dialogs = mask._curDialogs;
		var len = dialogs.length;
		var index;
		for(var i=0;i<len;i++){
			if(dialogs[i] === target){
				index = i;
				break;
			}
		}
		if(isShow){
			if(index !== undefined) return false;
			if(len > 0){
				dialogs[len - 1].style.zIndex = maskZIndex - 1;
			}
			dialogs.push(target);
		}else{
			index !== undefined && dialogs.splice(index,1);
		}
		dialogs.length > 0 && (dialogs[dialogs.length - 1].style.zIndex = maskZIndex + 1);
		return dialogs;
	}
	var widget = avalon.ui.dialog = function(element, data, vmodels){
		if(!mask){
			mask = document.createElement("div");
			mask.className = 'dialog-mask hide';
			document.body.appendChild(mask);
			//已打开的dialog的对象数组
			mask._curDialogs = [];
		}
		var options = data.dialogOptions;
		if(!options.content){
			options.content = element.innerHTML;
		}
		initMesWinBtn(options);
		var vmodel = avalon.define(data.dialogId,function(vm){
			avalon.mix(vm,options);
			vm.widgetElement = element;
			vm.$skipArray = ['widgetElement','open','close','afterShow','filterElement'];
			vm.$init = function(){
				var $el = avalon(element);
				$el.addClass("dialog");
				$el.attr("ms-visible","show");
				element.innerHTML = templete;
				avalon.scan(element, [vmodel].concat(vmodels));
				//标识触发afterShow的时候 是否是初始化后触发的
				var init = true;
				avalon.bind(element,"animationend",function(){
					vmodel.afterShow.call(vmodel.widgetElement,init);
					if(init){
						init = false;
					}
				});
				if(vmodel.show){
					vmodel.open();
				}
			};
			vm.$doOper = function(el){
				var type = vmodel.type;
				if(type === 'alert' || type === 'confirm'){
					if(el.type === 'ok'){
						vmodel.okFunc && vmodel.okFunc.call(vmodel);
						if(type === 'alert'){
							vmodel.close();
						}
					}else{
						vmodel.cancelFunc && vmodel.cancelFunc.call(vmodel);
						vmodel.close();
					}
				}else{
					if(el.close){
						vmodel.close();
					}else{
						el.handler && el.handler.call(vmodel);
					}
				}
			};
			/*
				options : {
					title : "",
					content : ""
				}
			*/
			vm.open = function(options){
				var el = vmodel.widgetElement;
				var re = dealCurDialogs(el,true);
				if(!re){
					return;
				}
				avalon.mix(vmodel,options || {});
				//显示
				mask.style.display = 'block';
				el.style.visibility = 'hidden';
				vmodel.show = true;
				setTimeout(function(){
					var h = avalon(el).height();
					el.style.top = (avalon(document.body).height() - h) / 2 + 'px';
					el.style.visibility = 'visible';
					el.classList.add('dialog-animate');
					if(vmodel.filterElement){
						vmodel.filterElement.classList.add("dialog-bgblur");
					}
				});
			};
			vm.close = function(){
				var el = vmodel.widgetElement;
				var dialogs = dealCurDialogs(el);
				if(dialogs.length === 0){
					mask.style.display = 'none';
				}
				vmodel.show = false;
				vmodel.onClose();
				if(vmodel.filterElement){
					vmodel.filterElement.classList.remove("dialog-bgblur");
				}
			};
		});
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
		show : false,
		buttons : [],
		lan : "zh",
		//窗口类型，normal窗口，alert窗口，confirm窗口
		type : "normal",
		//confirm窗口，确定事件
		okFunc : avalon.noop,
		//confirm alert窗口，取消事件
		cancelFunc : avalon.noop,
		content : null,
		contentCls : '',
		title : null,
		btnActiveClass : "",
		onClose : avalon.noop,
		//打开窗口时 带有模糊效果的element
		filterElement : null,
		afterShow : avalon.noop
	};
	(function(){
		var obj = {};
		function initMes(type,param){
			if(!obj[type]){
				var options = {
					type : type,
					show : true
				};
				avalon.mix(options,param);
				var vmodel = avalon.define({
					$id : +new Date,
					$dialogOptions : options
				});
				var el = document.createElement("div");
				var $id = type + (+new Date);
				el.setAttribute("ms-widget",['dialog',$id,'$dialogOptions'].join(","));
				document.body.appendChild(el);
				avalon.scan(el,vmodel);
				obj[type] = avalon.vmodels[$id];
			}else{
				obj[type].open(param);
			}
		}
		widget.alert = function(title,content,okFunc){
			initMes("alert",{
				title : title,
				content : content,
				okFunc : okFunc || null
			});
		};
		widget.confirm = function(title,content,okFunc,cancelFunc){
			if(!title){
				title = lanObj[mdSmartios.langCode].confirm;
			}
			initMes("confirm",{
				title : title,
				content : content,
				okFunc : okFunc || null,
				cancelFunc : cancelFunc || null
			});
		}
	})();
	/*
	考虑到如果页面中有大量窗口，页面初始化的时候可能会比较卡，遂提供如下方法
	打开窗口的时候才初始化，而且只初始化一次
	id : 窗口的dom id
	avalon.showDialog.dialog1 = {
		beforeInit : function(options,model){
			options.title = 'xxx';
			options.buttons = [];
			model.$xx = 'xxx';
		},
		//扫描窗口内部的vmodel的id
		scanModelName : ''
	}
	*/
	avalon.showDialog = function(id){
		var target = avalon.showDialog[id];
		var win = document.querySelector("#" + id);
		if(win.getAttribute("avalonctrl")){
			target.vmodel.open();
		}else{
			win.removeAttribute("ms-skip");
			var options = {};
			var model = {
				$id : +new Date,
				$dialogOptions : options
			};
			target.beforeInit && target.beforeInit(options,model);
			options.show = true;
			var vmodel = avalon.define(model);
			var $id = 'dialog' + (+new Date);
			win.setAttribute("ms-widget",['dialog',$id,'$dialogOptions'].join(","));
			var scanModels = [vmodel];
			if(target.scanModelName){
				scanModels.push(avalon.vmodels[target.scanModelName]);
			}
			avalon.scan(win,scanModels);
			target.vmodel = avalon.vmodels[$id];
			target.contentVmodel = vmodel;
		}
	};
});