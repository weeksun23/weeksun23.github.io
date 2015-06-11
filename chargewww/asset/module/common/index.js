define([
	"common/websocket","common/dialog/avalon.dialog",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
	],function(websocket){
	avalon.config({
		debug : true
	});
	//获取所有子元素，非文本节点
	avalon.fn.children = function(){
		var children = [];
		avalon.each(this[0].childNodes,function(i,node){
			node.nodeType === 1 && children.push(node);
		});
		return children;
	};
	avalon.fn.loading = function(isLoading){
		var children = this.children();
		var target;
		avalon.each(children,function(i,el){
			if(avalon(el).hasClass("mloading")){
				target = el;
				return false;
			}
		});
		var key = "data-loading-num";
		if(isLoading || isLoading === undefined){
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
		}else{
			if(!target) return;
			var num = +target.getAttribute(key);
			if(--num === 0){
				target.parentNode.removeChild(target);
			}else{
				target.setAttribute(key,num);
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
	function getCharge(begin_time,end_time,vmodel){
		websocket.send({
			command : "GET_USER_TOTAL_CHARGE",
			biz_content : {
				username : personalInfo.user_login_name,
				begin_time : begin_time,
				end_time : end_time
			}
		},vmodel.widgetElement,function(data){
			vmodel.sDateStr = begin_time;
			vmodel.eDateStr = end_time;
			vmodel.total_amount = data.total_amount;
			vmodel.total_received_amount = data.total_received_amount;
			vmodel.total_discount_time = data.total_discount_time;
			vmodel.total_discount_amount = data.total_discount_amount;
		});
	}
	var personalInfo = JSON.parse(localStorage.getItem("personalInfo") || '{}');
	var body = avalon.define({
		$id : "body",
		curPage : null,
		$personalWinOpts : {
			title : "个人信息",
			afterShow : function(isInit,vmodel){
				if(isInit){
					vmodel.user_login_name = personalInfo.user_login_name;
					vmodel.telphone = personalInfo.telphone;
					vmodel.user_role = personalInfo.user_role === '1' ? "管理员" : "收费员";
					vmodel.loginTime = personalInfo.loginTime;
					$("#personal-eDatePicker").datetimepicker(Index.getDateTimePickerOpts())
						.on("changeDate",function(){
							setTimeout(function(){
								getCharge(vmodel.sDateStr,vmodel.eDateStr,vmodel);
							},100);
						});
				}
				getCharge(personalInfo.loginTime,avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),vmodel);
			},
			user_login_name : "--",
			telphone : "--",
			user_role : "--",
			loginTime : '--',
			total_amount : "--",
			total_received_amount : "--",
			total_discount_time : "--",
			total_discount_amount : "--",
			sDateStr : '--',
			eDateStr : '--'
		},
		$alertOpts : {
			title : "提示信息",
			mes : "",
			buttons : [{
				theme : "primary",
				close : true,
				text : "确定"
			}]
		},
		$confirmOpts : {
			title : "确认信息",
			mes : "",
			okFunc : avalon.noop,
			buttons : [{
				theme : "primary",
				text : "确定",
				handler : function(vmodel,el){
					var re = vmodel.okFunc(vmodel,el);
					if(re !== false){
						vmodel.close();
					}
				}
			},{
				theme : "default",
				close : true,
				text : "取消"
			}]
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
		},
		logout : function(){
			Index.confirm("<i class='glyphicon glyphicon-log-out'></i> 确认登出吗?",function(vmodel,el){
				localStorage.removeItem("curAccount");
				location.href = "login.html";
				el.disabled = true;
				el.text = "登出中...";
				return false;
			});
		},
		accountName : localStorage.getItem("curAccount") || '--',
		total_parking_space_remaining : "--",
		total_parking_space : "--"
	});
	var Index = {
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
				minuteStep : 2,
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
		},
		alert : function(mes){
			var $alert = avalon.vmodels.$alert;
			$alert.mes = mes;
			$alert.open();
		},
		confirm : function(mes,func){
			var $confirm = avalon.vmodels.$confirm;
			$confirm.mes = mes;
			$confirm.okFunc = func;
			$confirm.open();
		},
		isCarNum : function(num){
			return num && num !== '--' && num.indexOf("未") === -1;
		},
		init : function(){
			websocket.send({
				command : "CHECK_PARKING_SPACE"
			},null,function(data){
				top.total_parking_space_remaining = data.total_parking_space_remaining;
				top.total_parking_space = data.total_parking_space;
			});
		}
	};
	return Index;
});