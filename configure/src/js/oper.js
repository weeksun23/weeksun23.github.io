define(function(require,exports,module){
	"use strict";
	module.exports = function(Configure){
		//获取元素的要储存到数据库的数据对象
		function getElObj(el){
			var bbox = el.getBBox();
			if(el.type === 'rect'){
				//面板
				return {
					x : bbox.x,
					y : bbox.y,
					tempId : el.id,
					detail : el.data('detail') || false
				};
			}else{
				//image元素
				var src = el.attr("src");
				src = src.substring(src.lastIndexOf("/") + 1).split(".")[0];
				return {
					x : bbox.x,
					y : bbox.y,
					width : bbox.width,
					height : bbox.height,
					src : src,
					tempId : el.id
				};
			}
		}
		var oper = Configure.oper = {
			deletePath : function(id){
				var el = Configure.paper.getById(id);
				var type = el.data('type');
				if(type === "pipe"){
					//普通管道只需删除管道以及其两端连线圆
					var set = el.data("circleSet");
				}else{
					//带虚线管道需删除虚线、管道以及管道两端连线圆
					var other = el.data("other");
					if(type === "dottedPipe"){
						set = other.data("circleSet");
					}else{
						set = el.data("circleSet");
					}
				}
				var isSel = false;
				if(set){
					//移除连线圆连接关系
					set.forEach(function(circle){
						if(circle.node.style.display !== 'none'){
							isSel = true;
						}
						Configure.connect.remove(circle.id);
					}).method("remove");
				}
				el.remove();
				other && other.remove();
				if(isSel){
					//如果删除的路径已被选中 则同时置空缓存的已选路径
					Configure.eve.onPathClick.setCurPath(null);
				}
			},
			deleteAndUnCon : function(id){
				var el = Configure.paper.getById(id);
				Configure.connect.remove(id);
				var set = el.data("circleSet");
				if(set){
					//先取消选中
					Configure.eve.onImgClick.removeChoose(el);
					set.method("remove");
				}
				var panelSet = el.data("panelSet");
				if(panelSet){
					panelSet.method("remove");
					return;
				}
				Configure.tooltip.removeTip(el);
				var stuff = el.data("leaf") || el.data("fire");
				if(stuff){
					var interval = stuff.data("interval");
					if(interval !== undefined){
						clearInterval(interval);
					}
					stuff.removeData("rotateTime").stop().remove();
				}
				if(el.data('typeVal') === Configure.constants.plc){
					$("#noplc").show();
				}
				el.remove();
			}
		};
		(function(oper){
			function getPathCircleData(path){
				var set = path.data("circleSet");
				if(set){
					var result = [],
						isSave = false;
					set.forEach(function(el){
						//如果其中一个连线圆已被连接 则需要保存这两个连线圆数据
						if(!isSave && Configure.connect.isConnect(el.id)){
							isSave = true;
						}
						result.push({
							cx : el.attr('cx'),
							cy : el.attr('cy'),
							fill : el.attr('fill'),
							tempId : el.id,
							belong : el.data("belong")
						});
					});
					return isSave ? result : [];
				}
				return [];
			}
			//保存数据
			oper.saveData = function(){
				var paper = Configure.paper;
				var device = [],
					connector = [],
					pipe = [],
					dottedPipe = [],
					pathCircle = [];
				var plc = [],
					coll = [],
					meter = [],
					boiler = [],
					sensor = [];
				var con = Configure.constants;
				var flag = true;
				var maxX = 0,maxY = 0;
				paper.forEach(function(el){
					if(el.data("underRect") || el.data("drawRect")){
						return;
					}
					var type = el.type;
					var myType = el.data("type");
					switch(type){
						case "image":
							var obj = getElObj(el);
							var val = el.data("typeVal");
							if(myType === 'device'){
								if(Configure.isAttachEl(val)){
									var attachElId = el.data("attachElId");
									if(attachElId === undefined){
										Configure.setMessage(el,"该设备还没绑定传感面板(右击绑定)");
										return flag = false;
									}
									obj.attachElId = attachElId;
								}
								device.push(obj);
							}else if(myType === "connector"){
								connector.push(obj);
							}else if(myType === 'heatdevice'){
								//绑定数据的设备 需特殊处理
								var attach = el.data('attach');
								if(!attach){
									Configure.setMessage(el,"该设备还没绑定数据(右击绑定)");
									return flag = false;
								}
								var heat = {tpl : JSON.stringify(obj)};
								if(val === con.plc){
									heat.plcCtrlId = attach.plcCtrlId;
									plc.push(heat);
								}else if(con.coll.indexOf(val) !== -1){
									heat.collCtrlId = attach.collCtrlId;
									coll.push(heat);
								}else if(con.boiler === val){
									heat.boilerId = attach.boilerId;
									boiler.push(heat);
								}
							}
						break;
						case "path":
							var obj = {
								stroke : el.attr("stroke"),
								path : el.attr("path"),
								"stroke-width" : el.attr("stroke-width"),
								tempId : el.id
							};
							if(myType === 'pipe'){
								var dash = el.data("dash");
								if(dash){
									obj["stroke-dasharray"] = dash;
								}
								pipe.push(obj);
								pathCircle = pathCircle.concat(getPathCircleData(el));
							}else if(myType === "dottedPipe-main"){
								obj.type = myType;
								obj.otherId = el.data("other").id;
								dottedPipe.push(obj);
								pathCircle = pathCircle.concat(getPathCircleData(el));
							}else if(myType === "dottedPipe"){
								obj.type = myType;
								dottedPipe.push(obj);
							}
						break;
						case "rect" :
							var panelSet = el.data('panelSet');
							if(panelSet){
								panelSet.forEach(function(el){
									if(el.data('main')){
										var obj = getElObj(el);
										var attach = el.data('attach');
										if(!attach){
											Configure.setMessage(el,"该设备还没绑定数据(右击绑定)");
											return flag = false;
										}
										//水泵绑定传感面板
										var attachElId = el.data("attachElId");
										if(attachElId !== undefined){
											obj.attachElId = attachElId;
										}
										var heat = {tpl : JSON.stringify(obj)};
										var typeVal = el.data("typeVal");
										if(typeVal === con.sensor){
											//传感器面板
											heat.sensorId = attach.sensorId;
											sensor.push(heat);
										}else if(typeVal === con.meter){
											heat.meterCalcId = attach.meterCalcId;
											meter.push(heat);
										}
										//清空 防止重复遍历
										this.clear();
										return false;
									}
								},panelSet);
								if(!flag){
									return false;
								}
							}
						break;
					}
					var bbox = el.getBBox();
					if(bbox.x2 > maxX){
						maxX = bbox.x2;
					}
					if(bbox.y2 > maxY){
						maxY = bbox.y2;
					}
				});
				if(!flag){
					return false;
				}
				var result = {
					device : device,
					connector : connector,
					pipe : pipe,
					dottedPipe : dottedPipe,
					pathCircle : pathCircle,
					connect : Configure.connect.getConnectData(),
					bgColor : $("#bgcolor").val() || "FFF",
					x : maxX,
					y : maxY
				};
				return {
					info : JSON.stringify(result),
					heat : JSON.stringify({
						plc : plc,
						coll : coll,
						meter : meter,
						sensor : sensor,
						boiler : boiler
					})
				};
			};
		})(oper);
		//TODO 增删查改模块
		(function(oper){
			var getCurd = (function(){
				var plcCurd;
				var collCurd;
				var meterCurd;
				var sensorCurd;
				var boilerCurd;
				var cameraCurd;
				//获取公共字段
				function getFields(obj){
					return $.extend({
						code : {text : "编码",type : "validatebox"},
						name : {text : "名称",type : "validatebox"},
						version : {text : "型号",type : "validatebox"},
						venderId : {text : "厂家",type : "combobox",options : {
							valueField : "venderId",
							textField : "name"
						}}
					},obj);
				}
				//获取基础数据 厂家 通讯服务
				function getBaseData($win,func){
					var data = getBaseData.data;
					if(data){
						func(data);
					}else{
						ake.ajax("../getBaseData.do",{dataTypeStr : "Vender,Comm"},function(result,mes){
							if(result){
								func(getBaseData.data = result);
							}else{
								MES.alert(mes);
							}
						},$win);
					}
				}
				//获取plc数据
				function getPlcBean(){
					var result;
					Configure.paper.forEach(function(el){
						if(el.type === 'image' && el.data('typeVal') === 'plc'){
							result = el.data("attach");
							return false;
						}
					});
					return result;
				}
				//获取所有采集控制器数据
				function getCollData(){
					var data = [{value : null,text : '空'}];
					Configure.paper.forEach(function(el){
						if(el.type === 'image' && 'conversion|climate'.indexOf(el.data('typeVal')) !== -1){
							var attach = el.data('attach');
							if(attach){
								data.push({
									value : attach.collCtrlId,
									text : attach.name + "[" + attach.code + "]"
								});
							}
						}
					});
					return data;
				}
				//公共回调 
				function doAfterOper(idKey,data,str,bean){
					var el = oper.getCurElement();
					if(str !== 'del'){
						if(str === 'add'){
							bean[idKey] = Number(data);
						}
						el.data("attach",bean);
						if(idKey === 'meterCalcId' || idKey === 'sensorId'){
							//如果是 计量设备 传感设备的回调 则还要设置单位以及标题
							Configure.panel.setUnitByBean(el, bean);
							Configure.panel.setText(el,'title',bean.name + (bean.meterCalcId ? "[" + bean.code + "]" : ""));
						}
					}else{
						if(idKey === 'sensorId'){
							var attachElId = el.data("attachElId");
							attachElId && Configure.paper.getById(attachElId).removeData("attachElId");
						}
						oper.deleteAndUnCon(el.id);
					}
				}
				//采集控制器 计量设备 操作前回调
				function doBeforeOper(str,bean){
					if(str === 'del'){
						return bean;
					}
					var plc = getPlcBean();
					if(plc){
						bean.flag = str === 'add';
						bean.plcCtrlId = plc.plcCtrlId;
						var el = oper.getCurElement();
						var tpl = getElObj(el);
						bean.tpl = JSON.stringify(tpl);
						return bean;
					}
					return false;
				}
				return {
					plc : function(){
						if(!plcCurd){
							plcCurd = new Curd("plcWin",getFields({
								commServiceId : {text : "通信服务",type : "combobox",options : {
									valueField : "commServiceId",
									textField : "name"
								}},
								addr : {text : "安装地址",type : "textarea",colspan : 2},
								plcCtrlId : {type : "hidden"}
							}),{
								idField : "plcCtrlId",
								textField : "name",
								name : "PLC控制柜",
								addUrl : "savePlcData.do",
								editUrl : "savePlcData.do",
								delUrl : "deletePlcData.do",
								onBeforeOper : function(str,bean){
									if(str === 'del'){
										return bean;
									}
									bean.flag = str === 'add';
									bean.attach = Number(Configure.constants.attach);
									bean.attachId = Number(Configure.constants.attachId);
									var el = oper.getCurElement();
									var tpl = getElObj(el);
									bean.tpl = JSON.stringify(tpl);
									return bean;
								},
								onInitFields : function($win,callback){
									var me = this;
									getBaseData($win,function(data){
										me.getFieldElement("commServiceId").combobox("loadData",data.Comm);
										me.getFieldElement("venderId").combobox("loadData",data.Vender);
										callback();
									});
								},
								onAfterOper : function(data,str,bean){
									doAfterOper.call(this,"plcCtrlId",data,str,bean);
								}
							});
						}
						return plcCurd;
					},
					coll : function(){
						if(!collCurd){
							collCurd = new Curd("collWin",getFields({
								meterTypeId : {text : "类型",type : "combobox",options : {
									disabled : true,
									data : Configure.constants.collData
								}},
								addr : {text : "安装地址",type : "textarea",colspan : 2},
								collCtrlId : {type : "hidden"}
							}),{
								idField : "collCtrlId",
								textField : "name",
								addUrl : "saveCollData.do",
								editUrl : "saveCollData.do",
								delUrl : "deleteCollData.do",
								name : "采集控制器",
								onBeforeOper : doBeforeOper,
								onShowWin : function($win,oper,data){
									this.getFieldElement("meterTypeId").combobox("setValue",data.meterTypeId);
								},
								onInitFields : function($win,callback){
									var me = this;
									getBaseData($win,function(data){
										me.getFieldElement("venderId").combobox("loadData",data.Vender);
										callback();
									});
								},
								onAfterOper : function(data,str,bean){
									doAfterOper.call(this,"collCtrlId",data,str,bean);
								}
							});
						}
						return collCurd;
					},
					meter : function(){
						if(!meterCurd){
							meterCurd = new Curd("meterWin",getFields({
								calcPrice : {text : "计量单价",type : "numberbox",options:{
									precision : 3,required : true
								}},
								deviceType : {text : "类型",type : "combobox",options : {
									data : Configure.constants.meterData
								}},
								collCtrlId : {text : "采集控制器",type : "combobox",options : {
									required : false
								}},
								addr : {text : "安装地址",type : "textarea",colspan : 2},
								meterCalcId : {type : "hidden"}
							}),{
								labelWidth : 72,
								idField : "meterCalcId",
								textField : "name",
								addUrl : "saveMeterData.do",
								editUrl : "saveMeterData.do",
								delUrl : "deleteMeterData.do",
								name : "计量设备",
								onShowWin : function(){
									this.getFieldElement("collCtrlId").combobox("loadData",getCollData());
								},
								onInitFields : function($win,callback){
									var me = this;
									getBaseData($win,function(data){
										me.getFieldElement("venderId").combobox("loadData",data.Vender);
										callback();
									});
								},
								onBeforeOper : doBeforeOper,
								onAfterOper : function(data,str,bean){
									doAfterOper.call(this,"meterCalcId",data,str,bean);
								}
							});
						}
						return meterCurd;
					},
					sensor : function(){
						if(!sensorCurd){
							sensorCurd = new Curd("sensorWin",getFields({
								name : {
									text : "名称",type : "combobox",options : {
										valueField : "name",
										textField : "name"
									}
								},
								sensorType : {text : "类型",type : "combobox",options : {
									data : Configure.constants.sensorData
								}},
								collCtrlId : {text : "采集控制器",type : "combobox",options : {
									required : false
								}},
								sensorId : {type : 'hidden'}
							}),{
								labelWidth : 72,
								idField : "sensorId",
								textField : "name",
								name : "传感器",
								addUrl : "saveSensorData.do",
								editUrl : "saveSensorData.do",
								delUrl : "deleteSensorData.do",
								onShowWin : function($win,oper){
									this.getFieldElement("collCtrlId").combobox("loadData",getCollData());
									this.getFieldElement("name").combobox(oper === 'edit' ? "disable" : "enable");
								},
								onInitFields : function($win,callback){
									var me = this;
									ake.ajax("getSensorNames.do",{},function(result,mes){
										if(result){
											me.getFieldElement("name").combobox("loadData",result);
											getBaseData($win,function(data){
												me.getFieldElement("venderId").combobox("loadData",data.Vender);
												callback();
											});
										}else{
											MES.alert(mes);
										}
									},$win);
								},
								onBeforeOper : doBeforeOper,
								onAfterOper : function(data,str,bean){
									doAfterOper.call(this,"sensorId",data,str,bean);
								}
							});
						}
						return sensorCurd;
					},
					boiler : function(){
						if(!boilerCurd){
							boilerCurd = new Curd("boilerWin",{
								code : {text : "编码",type : "validatebox"},
								name : {text : "名称",type : "validatebox"},
								model : {text : "类型",type : "combobox",options : {
									data : [{value : '燃煤',text : '燃煤'}]
								}},
								vender : {text : '厂家',type : 'validatebox'},
								boilerId : {type : 'hidden'}
							},{
								idField : "boilerId",
								textField : "name",
								name : "锅炉",
								addUrl : "saveBoilerData.do",
								editUrl : "saveBoilerData.do",
								delUrl : "deleteBoilerData.do",
								onBeforeOper : function(str,bean){
									if(str === 'del'){
										return bean;
									}
									var el = oper.getCurElement();
									var tpl = getElObj(el);
									bean.flag = str === 'add';
									bean.tpl = JSON.stringify(tpl);
									bean.heatSourceId  = Number(Configure.constants.attachId);
									return bean;
								},
								onAfterOper : function(data,str,bean){
									doAfterOper.call(this,"boilerId",data,str,bean);
								}
							});
						}
						return boilerCurd;
					},
					camera : function(){
						if(!cameraCurd){
							cameraCurd = new Curd("cameraWin",{
								cameraId : {type : "hidden"},
								code : {
									type : "validatebox",text : "编码"
								},
								userName : {
									type : "validatebox",text : "名称"
								},
								ip : {
									type : "validatebox",text : 'IP地址'
								},
								port : {
									type : "numberbox",text : "端口",options : {
										required : true
									}
								},
								addr : {
									type : 'textarea',text : "安装地址",colspan : 2
								}
							},{
								idField : "cameraId",
								textField : "code",
								name : "摄像头",
								addUrl : "saveCameraData.do",
								editUrl : 'saveCameraData.do',
								delUrl : "deleteCameraData.do",
								onBeforeOper : function(str,bean){
									if(str === 'del'){
										return bean;
									}
									bean.flag = str === 'add';
									bean.attach = Configure.constants.attach;
									bean.attachId = Configure.constants.attachId;
									return bean;
								},
								onAfterOper : function(){
									Configure.camera.reload();
								}
							});
						}
						return cameraCurd;
					}
				};
			})();
			var Curd;
			//根据typeVal的值获取相应仪表类型的value值,然后设置到窗口中
			function getValueByTypeVal(data,val){
				for(var i=0,ii=data.length;i<ii;i++){
					if(data[i].typeVal === val){
						return data[i].value;
					}
				}
			}
			//绑定数据到element上
			function doAttach(id){
				if(id.indexOf && id.indexOf("camera") !== -1){
					var $camera = $("#" + id);
					var target = getCurd.camera();
					if($camera.length > 0){
						target.edit($camera.data("camera"));
					}else{
						target.add();
					}
				}else{
					var con = Configure.constants;
					var el = Configure.paper.getById(id);
					var val = el.data("typeVal");
					var target = getCurdByTypeVal(val);
					if(con.coll.indexOf(val) !== -1){
						//气候补偿器 变频控制器
						var addData = {
							meterTypeId : getValueByTypeVal(Configure.constants.collData,val)
						};
					}
					var attach = el.data("attach");
					if(attach){
						//已绑定数据
						target.edit(attach);
					}else{
						target.add(addData);
					}
				}
			}
			//删除数据
			function unAttach(el,attach){
				getCurdByTypeVal(el.data("typeVal"))
					.del(attach);
			}
			//根据typeVal获取相应增删改实例
			function getCurdByTypeVal(val){
				var con = Configure.constants;
				if(con.coll.indexOf(val) !== -1){
					return getCurd.coll();
				}
				return getCurd[val]();
			}
			//绑定数据入口
			oper.deviceMenuAttachData = function(id){
				if(!Curd){
					ake.async("curd", function(result){
						Curd = result;
						doAttach(id);
					});
				}else{
					doAttach(id);
				}
			};
			//解除绑定入口
			oper.deviceMenuUnAttachData = function(id){
				if(typeof id == 'object'){
					if(!Curd){
						ake.async("curd", function(result){
							Curd = result;
							getCurd.camera().del(id);
						});
					}else{
						getCurd.camera().del(id);
					}
				}else{
					var el = Configure.paper.getById(id);
					var attach = el.data("attach");
					if(attach){
						if(!Curd){
							ake.async("curd", function(result){
								Curd = result;
								unAttach(el,attach);
							});
						}else{
							unAttach(el,attach);
						}
					}else{
						var typeVal = el.data('typeVal');
						if(Configure.isAttachEl(typeVal)){
							var attachElId = el.data("attachElId");
							if(attachElId){
								$.messager.confirm("确认信息","该设备已绑定了数据,确认删除吗?",function(r){
									if(r){
										var panel = Configure.paper.getById(attachElId);
										panel.removeData("attachElId");
										oper.deleteAndUnCon(id);
									}
								});
								return;
							}
						}
						oper.deleteAndUnCon(id);
					}
				}
			};
		})(oper);
	};
});