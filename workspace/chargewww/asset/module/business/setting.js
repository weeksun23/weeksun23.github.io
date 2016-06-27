require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	},
	urlArgs : "v=" + (+new Date)
});
require([
	"common/index",
	"common/table/avalon.table"
],function(Index){
	"use strict";
	Index.top.curIndex = 3;
	var content = avalon.define({
		$id : "content",
		isAdmin : Index.personalInfo.user_role === '1',
		search : function(){
			var data = getUserCarData(getList.data);
			var result = [];
			for(var i=0,ii;ii=data[i++];){
				if(content.searchName !== '' && ii.customer_name.indexOf(content.searchName) === -1){
					continue;
				}
				if(content.searchCarNum !== '' && ii.car_license_number.indexOf(content.searchCarNum) === -1){
					continue;
				}
				result.push(ii);
			}
			avalon.vmodels.$userTb.loadFrontPageData(result);
		},
		searchName : "",
		searchCarNum : "",
		$userTbOpts : {
			title : "VIP用户列表",
			columns : [
				{title : "车牌号码",field : "car_license_number"},
				{title : "车主",field : "customer_name"},
				{title : "类型",field : "vip_type",formatter : Index.mData.getVipType},
				{title : "有效期",field : "date",
					formatter : function(v,r){
						if(r.vip_type === '2'){
							return "永久";
						}
						return r.vip_begin_time
						 + "~<br>" + r.vip_end_time;
					}
				},
				{title : "安保",field : "is_open_safe_mode",
					formatter : function(v){
						return v === "0" ? "<span class='fz2 text-danger'>×</span>" : 
							"<span class='fz2 text-success'>√</span>";
					}
				},
				{title : "权限",field : "channel_permission_group_name"}
			]
		},
		parkingName : '--',
		/******************************************************************/
		authManage : function(){
			avalon.vmodels.$authManageWin.open();
		},
		$authManageWinOpts : {
			title : "通道权限管理",
			afterShow : function(isInit,vmodel){
				if(isInit){
					Index.initWidget("auth","table,$auth,$authOpts",vmodel);
				}
			},
			$authOpts : {
				title : "通道权限列表",
				chooseAuth : "",
				columns : [
					{title : '通道权限名字',field : "channel_permission_group_name"},
					{title : '通道详细',field : "channelNames"},
					{title : "起始时间",field : "permission_start_time"},
					{title : "结束时间",field : "permission_end_time"},
					{title : "操作",field : "oper",
						formatter : function(){
							return "<a href='javascript:void(0)' ms-click='edit(item)'>编辑</a> "+
							"<a href='javascript:void(0)' ms-click='del(item)'>删除</a>";
						}
					}
				],
				edit : function(item){
					var win = avalon.vmodels.$authWin;
					win.title = "编辑通道权限";
					win.$editAuth = item;
					win.authName = item.channel_permission_group_name;
					var start = (item.permission_start_time || "00:00:00").split(":");
					win.sH = parseInt(start[0]);
					win.sM = parseInt(start[1]);
					win.sS = parseInt(start[2]);
					var end = (item.permission_end_time || "00:00:00").split(":");
					win.eH = parseInt(end[0]);
					win.eM = parseInt(end[1]);
					win.eS = parseInt(end[2]);
					var seqList = item.seqList;
					avalon.each(document.querySelectorAll("#authWin-channelList input"),function(i,v){
						for(var i=0,ii;ii=seqList[i++];){
							if(ii === v.value){
								v.checked = true;
								return;
							}
						}
						v.checked = false;
					});
					win.open();
				},
				del : function(item){
					if(+item.channel_permission_group_seq === setAuthData.minGrpSeq){
						return Index.alert("抱歉，您不能删除该通道权限");
					}
					Index.confirm("确认删除该通道权限吗？",function(){
						var vip_car_list = getList.data.vip_car_list;
						var list = [];
						for(var i=0,ii;ii=vip_car_list[i++];){
							if(ii.channel_permission_group_seq === item.channel_permission_group_seq){
								list.push(ii);
							}
						}
						SYNCHRONIZATION_CUSTOMER({
							synchronization_type : '3',
							permission_group_mapping_list : item.$mappList,
							permission_group_list : [{
								channel_permission_group_seq : item.channel_permission_group_seq
							}],
							vip_car_list : list
						},avalon.vmodels.$authManageWin.widgetElement,function(){
							Index.alert("操作成功");
							refreshAuthUser();
						});
					});
				},
				onInit : function(){
					refreshAuthUser();
				}
			},
			addEntrance : function(){
				var win = avalon.vmodels.$authWin;
				win.title = "添加通道权限";
				win.$editAuth = null;
				win.open();
			}
		},
		$authWinOpts : {
			$editAuth : null,
			title : "",
			channelMes : "",
			authNameMes : "",
			timeMes : "",
			entranceData : [],
			sHData : [],
			sMData : [],
			sSData : [],
			eHData : [],
			eMDate : [],
			eSData : [],
			sH : 0,
			sM : 0,
			sS : 0,
			eH : 23,
			eM : 59,
			eS : 59,
			hideMes : function(){
				avalon.vmodels.$authWin.timeMes = '';
			},
			changeEntrance : function(){
				avalon.vmodels.$authWin.channelMes = '';
			},
			authName : "",
			changeAuthName : function(){
				avalon.vmodels.$authWin.authNameMes = '';
			},
			onClose : function(vmodel){
				vmodel.authName = '';
			},
			afterShow : function(isInit,vmodel){
				if(isInit){
					vmodel.sHData = Index.getMinToMax(0,23);
					vmodel.sMData = Index.getMinToMax(0,59);
					vmodel.sSData = Index.getMinToMax(0,59);
					vmodel.eHData = Index.getMinToMax(0,23);
					vmodel.eMDate = Index.getMinToMax(0,59);
					vmodel.eSData = Index.getMinToMax(0,59);
				}
				vmodel.channelMes = '';
			},
			buttons : [{
				text : "确定",
				theme : "default",
				handler : function(vmodel){
					var entrance = [];
					avalon.each(document.querySelectorAll("#authWin-channelList input"),function(i,v){
						if(v.checked){
							entrance.push(v.value);
						}
					});
					var authWin = avalon.vmodels.$authWin;
					if(entrance.length === 0){
						return authWin.channelMes = "请勾选通道";
					}
					if(authWin.authName === ''){
						return authWin.authNameMes = "请输入权限名称";
					}
					var sTime = [Index.paddingZero(vmodel.sH),Index.paddingZero(vmodel.sM),
						Index.paddingZero(vmodel.sS)].join(":");
					var eTime = [Index.paddingZero(vmodel.eH),Index.paddingZero(vmodel.eM),
						Index.paddingZero(vmodel.eS)].join(":");
					if(eTime <= sTime){
						return authWin.timeMes = "结束时间必须大于开始时间";
					}
					var grpList = [];
					var mappingList = [];
					if(authWin.$editAuth){
						var grpSeq = authWin.$editAuth.channel_permission_group_seq;
					}else{
						grpSeq = String(setAuthData.maxGrpSeq + 1);
					}
					//获取新的channel_permission_group_mapping
					for(var i=0,ii=entrance.length;i<ii;i++){
						mappingList.push({
							channel_permission_group_mapping_seq : String(setAuthData.maxMappingSeq + i + 1),
							entrance_channel_seq : entrance[i],
							channel_permission_group_seq : grpSeq
						});
					}
					grpList.push({
						channel_permission_group_seq : grpSeq,
						channel_permission_group_name : authWin.authName,
						permission_start_time : sTime,
						permission_end_time : eTime
					});
					if(authWin.$editAuth){
						//编辑
						//先删除channel_permission_group_mapping_seq
						SYNCHRONIZATION_CUSTOMER({
							synchronization_type : '3',
							permission_group_mapping_list : authWin.$editAuth.$mappList
						},authWin.widgetElement,function(){
							//再增加
							SYNCHRONIZATION_CUSTOMER({
								synchronization_type : '4',
								permission_group_list : grpList,
								permission_group_mapping_list : mappingList
							},authWin.widgetElement,function(){
								Index.alert("操作成功");
								authWin.close();
								authWin.authName = '';
								refreshAuthUser();
							});
						});
					}else{
						//添加
						SYNCHRONIZATION_CUSTOMER({
							synchronization_type : '2',
							permission_group_list : grpList,
							permission_group_mapping_list : mappingList
						},authWin.widgetElement,function(){
							Index.alert("操作成功");
							authWin.close();
							authWin.authName = '';
							refreshAuth();
						});
					}
				}
			},{
				text : "取消",
				theme : "default",
				close : true
			}]
		},
		/******************************************************************/
		userManage : function(){
			avalon.vmodels.$userManageWin.open();
		},
		$userManageWinOpts : {
			title : '用户管理',
			add : function(){
				var win = avalon.vmodels.$userWin;
				win.$editUser = null;
				win.title = '添加用户';
				win.open();
			},
			customer_name : "",
			customer_telphone : "",
			search : function(){
				var vmodel = avalon.vmodels.$userManageWin;
				var list = getList.data.vip_customer_list;
				var re = [];
				for(var i=0,ii;ii=list[i++];){
					if((vmodel.customer_name && ii.customer_name.indexOf(vmodel.customer_name) === -1) 
						|| (vmodel.customer_telphone && ii.customer_telphone.indexOf(vmodel.customer_telphone) === -1)){
						continue;
					}
					re.push(ii);
				}
				avalon.vmodels.$user.loadFrontPageData(re);
			},
			$userOpts : {
				title : "用户列表",
				columns : [
					{title : '名字',field : "customer_name"},
					{title : '车位数量',field : "carport_number"},
					{title : '车数量',field : "car_number"},
					{title : '用户角色',field : "customer_role"},
					{title : '用户类型',field : "customer_type"},
					{title : '电话号码',field : "customer_telphone"},
					{title : "拥有车辆",field : "cars",
						formatter : function(){
							return "<a href='javascript:void(0)' ms-click='cars(item)'>管理</a>";
						}
					},
					{title : "操作",field : "oper",
						formatter : function(){
							return "<a href='javascript:void(0)' ms-click='edit(item)'>编辑</a> "+
							"<a href='javascript:void(0)' ms-click='del(item)'>删除</a>";
						}
					}
				],
				cars : function(item){
					avalon.vmodels.$carManageWin.$curUser = item;
					avalon.vmodels.$carManageWin.open();
				},
				edit : function(item){
					var win = avalon.vmodels.$userWin;
					win.title = '编辑用户';
					win.$editUser = item.$model;
					win.open();
				},
				del : function(item){
					Index.confirm("确认删除该用户吗？",function(){
						var vip_customer_list = [{
							vip_customer_seq : item.vip_customer_seq
						}];
						var vip_car_list = getCarTbData(getList.data,item.vip_customer_seq);
						SYNCHRONIZATION_CUSTOMER({
							synchronization_type : '3',
							vip_customer_list : vip_customer_list,
							vip_car_list : vip_car_list
						},avalon.vmodels.$authManageWin.widgetElement,function(){
							Index.alert("操作成功");
							getList(function(data){
								setUserTbData(data);
								setUserData(data);
							});
						});
					});
				}
			},
			afterShow : function(isInit,vmodel){
				if(isInit){
					Index.initWidget("user","table,$user,$userOpts",vmodel);
					setUserData(getList.data);
				}
			}
		},
		$userWinOpts : {
			title : '',
			$editUser : null,
			buttons : [{
				text : "确定",
				theme : "primary",
				handler : function(vmodel){
					var model =	vmodel.model.$model;
					for(var i in model){
						if(model[i] === ''){
							vmodel[i + "_mes"] = "该输入项为必输项";
							return false;
						}
						if(i === "carport_number" || i === 'car_number' || i === 'customer_telphone'){
							if(!/^\d*$/.test(model[i])){
								vmodel[i + "_mes"] = "请输入数字";
								return false;
							}
						}
					}
					var list = [];
					if(vmodel.$editUser){
						var synchronization_type = '4';
						list.push(avalon.mix({
							vip_customer_seq : vmodel.$editUser.vip_customer_seq
						},model));
					}else{
						synchronization_type = '2';
						list.push(avalon.mix({
							vip_customer_seq : String(+setUserData.maxSeq + 1)
						},model));
					}
					SYNCHRONIZATION_CUSTOMER({
						synchronization_type : synchronization_type,
						vip_customer_list : list
					},avalon.vmodels.$userWin.widgetElement,function(){
						Index.alert("操作成功");
						vmodel.close();
						refreshUser();
					});
				}
			},{
				text : "取消",
				close : true
			}],
			afterShow : function(isInit,vmodel){
				if(isInit){
					var model =	vmodel.$model.model;
					for(var i in model){
						(function(i){
							vmodel.model.$watch(i,function(){
								vmodel[i + "_mes"] = '';
							});
						})(i);
					}
				}
				if(vmodel.$editUser){
					model = vmodel.model;
					for(var i in vmodel.$editUser){
						if(model[i] !== undefined){
							model[i] = vmodel.$editUser[i];
						}
					}
				}else{
					for(var i in vmodel.model.$model){
						vmodel.model[i] = '';
					}
				}
			},
			model : {
				customer_name : "",
				carport_number : "",
				car_number : "",
				customer_role : "",
				customer_telphone : "",
				customer_type : ""
			},
			customer_name_mes : "",
			carport_number_mes : "",
			car_number_mes : "",
			customer_role_mes : "",
			customer_telphone_mes : "",
			customer_type_mes : ""
		},
		/******************************************************************/
		$carManageWinOpts : {
			title : "车辆管理",
			add : function(){
				var num = avalon.vmodels.$carManageWin.$curUser.car_number;
				if(avalon.vmodels.$cars.frontPageData.length >= +num){
					return Index.alert("该用户的车数量已达到上限("+num+"辆),不能再添加");
				}
				var win = avalon.vmodels.$carWin;
				win.$editCar = null;
				win.open();
			},
			$curUser : null,
			afterShow : function(isInit,vmodel){
				if(isInit){
					Index.initWidget("cars","table,$cars,$carsOpts",vmodel);
				}
				setCarTbData(getList.data,vmodel.$curUser.vip_customer_seq);
			},
			$carsOpts : {
				edit : function(item){
					var win = avalon.vmodels.$carWin;
					win.$editCar = item;
					win.open();
				},
				del : function(item){
					Index.confirm("确认删除该车辆吗？",function(){
						var vip_car_list = [{
							vip_car_seq : item.vip_car_seq
						}];
						SYNCHRONIZATION_CUSTOMER({
							synchronization_type : '3',
							vip_car_list : vip_car_list
						},avalon.vmodels.$authManageWin.widgetElement,function(){
							Index.alert("操作成功");
							getList(function(data){
								setUserTbData(data);
								setCarTbData(data,avalon.vmodels.$carManageWin.$curUser.vip_customer_seq);
							});
						});
					});
				},
				columns : [
					{title : "车牌号码",field : "car_license_number"},
					{title : "车主",field : "customer_name"},
					{title : "类型",field : "vip_type",formatter : Index.mData.getVipType},
					{title : "有效期",field : "date",
						formatter : function(v,r){
							if(r.vip_type === '2'){
								return "永久";
							}
							return r.vip_begin_time
							 + "~<br>" + r.vip_end_time;
						}
					},
					{title : "安保",field : "is_open_safe_mode",
						formatter : function(v){
							return v === "0" ? "<span class='fz2 text-danger'>×</span>" : 
								"<span class='fz2 text-success'>√</span>";
						}
					},
					{title : "权限",field : "channel_permission_group_name"},
					{title : "操作",field : "oper",
						formatter : function(){
							return "<a href='javascript:void(0)' ms-click='edit(item)'>编辑</a> "+
							"<a href='javascript:void(0)' ms-click='del(item)'>删除</a>"
						}
					}
				]
			}
		},
		$carWinOpts : {
			$editCar : null,
			title : '',
			model : {
				car_license_number : '',
				car_license_color : "0",
				car_license_type : "0",
				vip_type : "2",
				car_type : '0',
				car_logo : '0',
				vip_begin_time : "",
				vip_end_time : "",
				channel_permission_group_seq : "1"
			},
			car_license_number_mes : "",
			vip_begin_time_mes : "",
			vip_end_time_mes : "",
			carLicenseColors : [],
			carLicenseType : [],
			vipType : [],
			carType : [],
			carLogo : [],
			channelPermissionGrp : [],
			dateDisabled : false,
			afterShow : function(isInit,vmodel){
				if(isInit){
					$("#sTimePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
					$("#eTimePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
					vmodel.carLicenseColors = Index.mData.car_license_color;
					vmodel.carLicenseType = Index.mData.car_license_type;
					vmodel.vipType = Index.mData.vip_type.slice(2);
					vmodel.carType = Index.mData.car_type;
					vmodel.carLogo = Index.mData.car_logo;
					avalon.each(['car_license_number','vip_begin_time','vip_end_time'],function(i,v){
						vmodel.model.$watch(v,function(){
							vmodel[v + "_mes"] = '';
						});
					});
					vmodel.model.$watch("vip_type",function(newVal){
						if(newVal === '2'){
							vmodel.dateDisabled = true;
							vmodel.model.vip_begin_time = "2000-01-01 00:00:00";
							vmodel.model.vip_end_time = "2100-01-01 00:00:00";
						}else{
							vmodel.dateDisabled = false;
							vmodel.model.vip_begin_time = ""
							vmodel.model.vip_end_time = "";
						}
					});
				}
				vmodel.channelPermissionGrp = getList.data.permission_group_list;
				if(vmodel.$editCar){
					vmodel.title = "编辑车辆信息";
					var $model = vmodel.model.$model;
					for(var i in $model){
						if(vmodel.$editCar[i] !== undefined){
							vmodel.model[i] = vmodel.$editCar[i];
						}
					}
					if(vmodel.model.vip_type === '2'){
						vmodel.model.vip_begin_time = "2000-01-01 00:00:00";
						vmodel.model.vip_end_time = "2100-01-01 00:00:00";
					}
				}else{
					vmodel.model.car_license_number = '';
					if(vmodel.model.vip_type === '2'){
						vmodel.model.$fire("vip_type",'2');
					}else{
						vmodel.model.vip_type = '2';
					}
					vmodel.title = "添加车辆信息";
				}
			},
			buttons : [{
				text : '确定',
				theme : "primary",
				handler : function(vmodel){
					var model = vmodel.model;
					var f = true;
					avalon.each(['car_license_number','vip_begin_time','vip_end_time'],function(i,v){
						if(!model[v]){
							vmodel[v + "_mes"] = "该输入项为必输项";
							return f = false;
						}
						if(v === 'vip_end_time'){
							if(model.vip_end_time <= model.vip_begin_time){
								vmodel.vip_end_time_mes = "结束日期必须大于开始日期";
								return f = false;
							}
						}
					});
					if(f){
						var vip_customer_seq = avalon.vmodels.$carManageWin.$curUser.vip_customer_seq;
						var vip_car_list = [];
						if(vmodel.$editCar){
							if(isCarNumberExist(model.$model.car_license_number,vmodel.$editCar.vip_car_seq)){
								return Index.alert("该车牌号码已存在，请修改");
							}
							var obj = avalon.mix({
								vip_car_seq : vmodel.$editCar.vip_car_seq,
								vip_customer_seq : vip_customer_seq
							},model.$model);
							var synchronization_type = '4';
						}else{
							if(isCarNumberExist(model.$model.car_license_number)){
								return Index.alert("该车牌号码已存在，请修改");
							}
							obj = avalon.mix({
								vip_car_seq : String(+getUserCarData.maxSeq + 1),
								vip_customer_seq : vip_customer_seq
							},model.$model);
							synchronization_type = '2';
						}
						vip_car_list.push(obj);
						SYNCHRONIZATION_CUSTOMER({
							synchronization_type : synchronization_type,
							vip_car_list : vip_car_list
						},avalon.vmodels.$userWin.widgetElement,function(){
							Index.alert("操作成功");
							vmodel.close();
							getList(function(data){
								setUserTbData(data);
								setCarTbData(data,vip_customer_seq);
							});
						});
					}
				}
			},{
				text : "取消",
				close : true
			}]
		}
	});
	avalon.scan();
	function SYNCHRONIZATION_CUSTOMER(content,el,func){
		Index.websocket.send({
			command : "SYNCHRONIZATION_CUSTOMER",
			biz_content : content
		},el,function(data){
			if(data.code === "0" && data.msg === "ok"){
				func && func();
			}
		});
	}
	function getList(func){
		Index.websocket.send({
			command : "GET_CUSTOMER_INFOR"
		},document.body,function(data){
			getList.data = data;
			func(data);
		});
	}
	function refreshAuthUser(){
		getList(function(data){
			setUserTbData(data);
			setAuthData(data);
		});
	}
	//刷新页面的车场名称
	function refreshUserTb(){
		getList(setUserTbData);
	}
	function getUserCarData(data){
		var vip_customer_list = data.vip_customer_list;
		var vip_car_list = data.vip_car_list;
		var permission_group_list = data.permission_group_list;
		var permission_group_mapping_list = data.permission_group_mapping_list;
		var maxSeq = '0';
		for(var i=0,ii;ii=vip_car_list[i++];){
			if(+ii.vip_car_seq > +maxSeq){
				maxSeq = ii.vip_car_seq;
			}
			for(var j=0,jj;jj=vip_customer_list[j++];){
				if(jj.vip_customer_seq === ii.vip_customer_seq){
					avalon.mix(ii,jj);
					break;
				}
			}
			for(j=0;jj=permission_group_list[j++];){
				if(jj.channel_permission_group_seq === ii.channel_permission_group_seq){
					ii.channel_permission_group_name = jj.channel_permission_group_name;
					break;
				}
			}
		}
		getUserCarData.maxSeq = maxSeq;
		return vip_car_list;
	}
	function setUserTbData(data){
		avalon.vmodels.$userTb.loadFrontPageData(getUserCarData(data));
	}
	function refreshCarTb(vip_customer_seq){
		getList(function(data){
			setCarTbData(data,vip_customer_seq);
		});
	}
	function getCarTbData(data,vip_customer_seq){
		var list = getUserCarData(data);
		var result = [];
		for(var i=0,ii;ii=list[i++];){
			if(ii.vip_customer_seq === vip_customer_seq){
				result.push(ii);
			}
		}
		return result;
	}
	function setCarTbData(data,vip_customer_seq){
		avalon.vmodels.$cars.loadFrontPageData(getCarTbData(data,vip_customer_seq));
	}
	//刷新通道权限列表
	function refreshAuth(){
		getList(setAuthData);
	}
	function setAuthData(data){
		var permission_group_list = data.permission_group_list;
		var permission_group_mapping_list = data.permission_group_mapping_list;
		var maxGrpSeq = 0;
		var maxMappingSeq = 0;
		var minGrpSeq = permission_group_list.length > 0 ?
			+permission_group_list[0].channel_permission_group_seq : 1;
		for(var i=0,ii;ii=permission_group_list[i++];){
			if(+ii.channel_permission_group_seq > maxGrpSeq){
				maxGrpSeq = +ii.channel_permission_group_seq;
			}
			if(+ii.channel_permission_group_seq < minGrpSeq){
				minGrpSeq = +ii.channel_permission_group_seq
			}
			var seqList = [];
			var nameList = [];
			var mappList = [];
			for(var j=0,jj;jj=permission_group_mapping_list[j++];){
				if(+jj.channel_permission_group_mapping_seq > maxMappingSeq){
					maxMappingSeq = +jj.channel_permission_group_mapping_seq;
				}
				if(jj.channel_permission_group_seq === ii.channel_permission_group_seq){
					seqList.push(jj.entrance_channel_seq);
					nameList.push(getChannelNameBySeq(jj.entrance_channel_seq));
					mappList.push(jj);
				}
			}
			ii.seqList = seqList;
			ii.channelNames = nameList.join(",");
			ii.$mappList = mappList;
		}
		setAuthData.maxGrpSeq = maxGrpSeq;
		setAuthData.maxMappingSeq = maxMappingSeq;
		setAuthData.minGrpSeq = minGrpSeq;
		avalon.vmodels.$auth.loadFrontPageData(permission_group_list);
	}
	//刷新用户数据
	function refreshUser(){
		getList(setUserData);
	}
	function setUserData(data){
		var list = data.vip_customer_list;
		var maxSeq = '0';
		for(var i=0,ii;ii=list[i++];){
			if(+ii.vip_customer_seq > +maxSeq){
				maxSeq = ii.vip_customer_seq;
			}
		}
		setUserData.maxSeq = maxSeq;
		avalon.vmodels.$user.loadFrontPageData(data.vip_customer_list);
	}
	function getChannelNameBySeq(seq){
		for(var i=0,ii;ii=Entrance_channel_list[i++];){
			if(ii.entrance_channel_seq === seq){
				return ii.entrance_name;
			}
		}
		return '';
	}
	//车牌号码 是否已存在
	function isCarNumberExist(number,seq){
		var list = getList.data.vip_car_list;
		for(var i=0,ii=list.length;i<ii;i++){
			var item = list[i];
			if(item.car_license_number === number && item.vip_car_seq !== seq){
				return true;
			}
		}
		return false;
	}
	var Entrance_channel_list = [];
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body,function(data){
		if(data.code === '0' && data.msg === "ok"){
			Index.init(function(){
				Entrance_channel_list = data.entrance_channel_list;
				avalon.vmodels.$authWin.entranceData = Entrance_channel_list;
				content.parkingName = data.parking_lot_list[0].parking_lot_name;
				getList(function(data){
					setUserTbData(data);
				});
			},document.body,data);
		}
	});
});