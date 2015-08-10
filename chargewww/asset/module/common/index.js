define([
	"common/websocket",
	"business/data",
	"common/dialog/avalon.dialog",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
	],function(websocket,mData){
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
			vmodel.total_amount = Index.getMoney(data.total_amount);
			vmodel.total_received_amount = Index.getMoney(data.total_received_amount);
			vmodel.total_discount_time = data.total_discount_time;
			vmodel.total_discount_amount = Index.getMoney(data.total_discount_amount);
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
					$("#personal-eDatePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}))
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
			eDateStr : '--',
			changePwd : function(){
				avalon.vmodels.$pwd.open();
			}
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
		},
		$pwdOpts : {
			title : "修改密码",
			changed_password_confirm : "",
			changed_password_confirm_mes : "",
			origin_password : "",
			origin_password_mes : "",
			changed_password : "",
			changed_password_mes : "",
			afterShow : function(isInit,vmodel){
				if(isInit){
					avalon.each(["origin_password","changed_password","changed_password_confirm"],function(i,v){
						vmodel.$watch(v,function(){
							vmodel[v + "_mes"] = '';
						});
					});
				}
			},
			buttons : [{
				theme : "primary",
				text : "确定",
				handler : function(vmodel){
					var f = true;
					avalon.each(["origin_password","changed_password","changed_password_confirm"],function(i,v){
						if(vmodel[v] === ''){
							vmodel[v + "_mes"] = "该输入项为必填项";
							return f = false;
						}else{
							vmodel[v + "_mes"] = '';
						}
						if(v === "changed_password_confirm"){
							if(vmodel.changed_password_confirm !== vmodel.changed_password){
								vmodel.changed_password_confirm_mes = "两次输入的密码不一样";
								return f = false;
							}
						}
					});
					if(f){
						websocket.send({
							command : "CHANGE_PASSWORD",
							biz_content : {
								origin_user_login_name : top.accountName,
								origin_password : vmodel.origin_password,
								changed_password : vmodel.changed_password
							}
						},null,function(data){
							if(data.code === '0'){
								Index.alert("修改成功");
								vmodel.close();
							}else{
								if(data.msg === 'fail'){
									Index.alert("原密码错误");
								}else{
									Index.alert("修改失败");
								}
							}
						},true);
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
				websocket.send({
					command : "USER_ACCESS",
					biz_content : {
						username : top.accountName,
						ip : "127.0.0.1",
						time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),
						type : "LOGOUT"
					}
				},document.body,function(data){
					if(data.code === '0' && data.msg === "ok"){
						localStorage.removeItem("curAccount");
						location.href = "login.html";
						el.disabled = true;
						el.text = "登出中...";
					}
				});
			});
		},
		accountName : localStorage.getItem("curAccount") || '--',
		total_parking_space_remaining : "--",
		total_parking_space : "--"
	});
	websocket.callbacks.PUSH_PARKING_SPACE = function(data){
		top.total_parking_space_remaining = data.total_parking_space_remaining;
		top.total_parking_space = data.total_parking_space;
	};
	var Index = window.Index = {
		mData : mData,
		top : top,
		body : body,
		noCarImgSrc : "image/no-car.png",
		getDateTimePickerOpts : function(obj){
			return avalon.mix({
				language:  'zh-CN',
			    format : "yyyy-mm-dd hh:ii:ss",
			    weekStart: 1,
			    todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				minuteStep : 2,
				startView: 1
			},obj);
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
		init : function(func){
			websocket.send({
				command : "CHECK_PARKING_SPACE"
			},null,function(data){
				top.total_parking_space_remaining = data.total_parking_space_remaining;
				top.total_parking_space = data.total_parking_space;
				func && func();
			},true);
		},
		initWidget : function(id,widgetAttr,vmodel){
			var el = document.getElementById(id);
			el.setAttribute("ms-widget",widgetAttr);
			avalon.scan(el,vmodel);
		},
		onImgError : function(img){
			img.src = Index.noCarImgSrc;
		},
		getRange : function(list,key){
			if(list.length === 0) return;
			var min = list[0].enter_time;
			var max = min;
			for(var i=1,ii;ii=list[i++];){
				if(ii[key] < min){
					min = ii[key];
				}else if(ii[key] > max){
					max = ii[key];
				}
			}
			return {
				min : min,
				max : max
			};
		},
		getPassType : function(v){
			if(v === "1"){
				return "严模式";
			}else if(v === '2'){
				return "宽模式";
			}
		},
		getMoney : function(m){
			return "￥" + (+m / 100).toFixed(2);
		},
		personalInfo : personalInfo,
		getUnsameVal : function(list,key){
			var obj = {};
			for(var i=0,ii;ii=list[i++];){
				obj[ii[key]] = 1;
			}
			var re = [];
			for(var i in obj){
				re.push(i);
			}
			return re;
		},
		getEmptyStr : function(v){
			return v === "--" ? "" : v;
		},
		getMinToMax : function(min,max){
			var re = [];
			for(var i=min;i<=max;i++){
				re.push(i);
			}
			return re;
		},
		paddingZero : function(str,len){
	    	len = len || 2;
	    	str = str + "";
	    	var strLen = str.length;
	    	if(strLen >= len) return str;
	    	return new Array(len - strLen + 1).join('0') + str;
	    },
	    dealPicSrc : function(src){
	    	var isFull = src.indexOf("_full_") !== -1;
	    	var isPlate = src.indexOf("_plate_") !== -1;
	    	if(!isFull && !isPlate){
	    		return Index.noCarImgSrc;
	    	}
	    	if(isFull){
	    		var folderName = "FullPic";
	    		var ip = src.split("_full_")[0];
	    	}else{
	    		folderName = "PlateNumberPic";
	    		ip = src.split("_plate_")[0];
	    	}
	    	ip = ip.replace(/_/g,".");
	    	return "http://" + ip + ":8088/" + folderName + "/" + src + "?" + (+new Date);
	    }
	};
	return Index;
});