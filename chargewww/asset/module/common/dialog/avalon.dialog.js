define(["avalon","text!./avalon.dialog.html"],function(avalon,templete){
	function initButtons(buttons){
		avalon.each(buttons,function(i,el){
			var obj = {
				close : false,
				theme : 'default',
				handler : null,
				text : "",
				iconCls : null
			};
			for(var i in obj){
				if(el[i] === undefined){
					el[i] = obj[i];
				}
			}
		});
	}
	var modalBackDrop;
	var widget = avalon.ui.dialog = function(element, data, vmodels){
		if(!modalBackDrop){
			modalBackDrop = document.createElement("div");
			modalBackDrop.className = "modal-backdrop fade hide";
			document.body.appendChild(modalBackDrop);
			if(avalon.support.transitionend){
				avalon.bind(modalBackDrop,avalon.support.transitionend,function(){
					if(!avalon(this).hasClass("in")){
						avalon(this).addClass("hide");
					}
				});
			}
		}
		var options = data.dialogOptions;
		initButtons(options.buttons);
		if(!options.content){
			options.content = element.innerHTML;
		}
		if(!options.title){
			options.title = element.title || '';
		}
		var vmodel = avalon.define(data.dialogId,function(vm){
			avalon.mix(vm,options);
			vm.widgetElement = element;
			vm.$skipArray = ['widgetElement','close','open','show'];
			vm.$init = function(){
				avalon(element).addClass("modal fade");
				element.innerHTML = templete;
				avalon.scan(element, vmodel);
				if(avalon.support.transitionend){
					var isInit = true;
					avalon.bind(element,avalon.support.transitionend,function(){
						if(!avalon(this).hasClass("in")){
							this.style.display = 'none';
							avalon(document.body).removeClass("modal-open");
						}else{
							vmodel.afterShow(isInit);
							isInit = false;
						}
					});
				}
				avalon.bind(element,"click",function(e){
					if(e.target === this){
						vmodel.close();
					}
				});
				if(vmodel.show){
					vmodel.open(true);
				}
			};
			vm.$remove = function(){
				element.innerHTML = element.textContent = "";
			};
			vm.$clickBtn = function(el){
				if(el.close){
					vmodel.close();
				}else{
					el.handler && el.handler.call(this,vmodel);
				}
			};
			vm.close = function(){
				if(avalon.support.transitionend){
					avalon(element).removeClass("in");
					avalon(modalBackDrop).removeClass('in');
				}else{
					element.style.display = 'none';
					avalon(modalBackDrop).addClass("hide");
				}
			};
			vm.open = function(isInit){
				element.style.display = 'block';
				var $modalBack = avalon(modalBackDrop).removeClass("hide");
				if(avalon.support.transitionend){
					//强制reflow
					element.offsetWidth;
					modalBackDrop.offsetWidth;
					avalon(element).addClass('in');
				}else{
					vmodel.afterShow(isInit);
				}
				$modalBack.addClass('in');
				avalon(document.body).addClass("modal-open");
			};
		});
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
		buttons : [],
		title : null,
		content : null,
		show : false,
		afterShow : avalon.noop
	};
	/*
	avalon.showDialog.xxx : {
		vmodel : 生成的dialog的vmodel,
		beforeInit : 对dialog的配置对象进行处理,
		scanModelName : 扫描dialog的额外vmodel
	}
	*/
	avalon.initDialog = function(id,options){
		var win = document.getElementById(id);
		if(win){
			return false;
		}
		if(!win){
			win = document.createElement("div");
			win.id = id;
			win.style.display = 'none';
			document.body.appendChild(win);
		}
		avalon.showDialog[id] = options;
	};
	avalon.showDialog = function(id){
		var target = avalon.showDialog[id];
		if(!target){
			avalon.error("请先配置avalon.showDialog." + id + "对象");
		}
		var win = document.getElementById(id);
		if(win.getAttribute("avalonctrl")){
			target.vmodel.open();
		}else{
			win.removeAttribute("ms-skip");
			var options = {};
			target.beforeInit && target.beforeInit(options);
			options.show = true;
			var vmodel = avalon.define({
				$dialogOptions : options
			});
			var $id = 'dialog' + (+new Date);
			win.setAttribute("ms-widget",['dialog',$id,'$dialogOptions'].join(","));
			avalon.scan(win,vmodel);
			target.vmodel = avalon.vmodels[$id];
		}
	};
});