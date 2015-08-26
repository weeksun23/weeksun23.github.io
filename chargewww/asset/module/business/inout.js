function GetSelectWndInfo(){
	avalon.log("摄像头回调参数",arguments);
}
require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
require([
	"common/index",
	'common/base64',
	"common/tooltip/avalon.tooltip",
	"common/table/avalon.table",
	"common/date/avalon.date"
],function(Index,Base64){
	avalon.ui.dialog.defaults.onClose = function(){
		cameraHelper.afterClose();
	};
	avalon.ui.dialog.defaults.onBeforeOpen = function(){
		cameraHelper.beforeShow();
	};
	Index.top.curIndex = 0;
	var REAL_TIME_CAR_LIST;
	function matchNum(num,list){
		var numLen = num.length;
		for(var i=0,item;item=list[i++];){
			var carNum = item.enter_car_license_number;
			if(carNum.indexOf('无牌车') === -1 &&
				carNum.indexOf("未识别") === -1){
				//权重
				var val = 0;
				var carNumLen = carNum.length;
				//车牌长度相同权重+1
				if(numLen === carNumLen) val++;
				//按位比较 每相同一位 权重+1
				for(var j=0;j<carNumLen;j++){
					if(carNum.charAt(j) === num.charAt(j)){
						if(j === 0){
							val += 10;
						}else if(j === 1){
							val += 5;
						}else{
							val++;
						}
					}
				}
				item.val = val;
			}else{
				//无牌车权重为0
				item.val = 0;
			}
		}
		//根据权重排序
		list.sort(function(a,b){
			return b.val - a.val;
		});
	}
	function getCharge(car_license_number,enter_time,leave_time){
		if(content.outDiscount){
			for(var i=0,ii=content.discountList.length;i<ii;i++){
				var item = content.discountList[i];
				if(item.discount_name === content.outDiscount){
					var time = new Date(enter_time.replace(/\-/g,"/")).getTime();
					var ms = +item.discount_time_min * 60 * 1000;
					enter_time = avalon.filters.date(new Date(time + ms),"yyyy-MM-dd HH:mm:ss");
					break;
				}
			}
		}
		Index.websocket.send({
			command : "GET_CHARGE",
			biz_content : {
				car_license_number : car_license_number,
				car_card_number : "",
				enter_time : Index.getEmptyStr(enter_time),
				leave_time : leave_time,
				request_origin : "web"
			}
		},document.body,function(data){
			if(data.code === '0' && data.msg === "ok"){
				content.outCarCostActual = data.supplementary;
				content.outCarCost = Index.getMoney(data.supplementary);
				content.total_amount = data.total_amount;
			}
		});
	}
	//开关闸
	function toggleDoor(seq,carNum,time,area,control_type,func){
		Index.websocket.send({
			command : "CONVERTOR_CONTROL",
			biz_content : {
				entrance_channel_seq : seq,
				control_type : control_type || "1",
				car_license_number : carNum,
				time : time,
				opera_name : localStorage.getItem("curAccount"),
				opera_time : time
			}
		},area,function(data){
			Index.alert("操作成功");
			func && func();
		});
	}
	//校正车牌
	function doCorrectCarNum(oldNum,time,newNum,vmodel){
		Index.websocket.send({
			command : "SYNCHRONIZATION_ADJUST",
			biz_content : {
				is_appoint : "1",
				origin_car_license_number : oldNum,
				origin_time : time,
				adjust_list_car_license_number : newNum,
				adjust_list_recognition_confidence : "100",
				report_status : "1",
				report_time : "",
				modify_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),
				modify_by : Index.top.accountName
			}
		},vmodel.widgetElement,function(data){
			if(data.code === "0" && data.msg === "ok"){
				Index.alert("校正成功");
				Index.websocket.send({
					command : "GET_LAST_REAL_TIME_CAR",
					biz_content : {
						channel : content.inList[content.inIndex].entrance_channel_seq
					}
				},document.body,GET_LAST_REAL_TIME_CAR_RETURN);
				content.inCarNum = newNum;
				vmodel.close();
			}else{
				Index.alert("校正失败，请重试。");
			}
		});
	}
	function createVideo(direction){
		var target = content[direction + "List"][content[direction + "Index"]];
			for(var i=0,ii;ii=cameraData[i++];){
				if(ii.entrance_channel_seq === target.entrance_channel_seq){
					var factor = 1360 / 1024;
					var container = document.getElementById(direction + "VideoContainer");
					var w = avalon(container).width();
					var h = parseInt(w / factor);
					container.innerHTML =
						"<embed type='application/hwitcp-webvideo-plugin' "+
						"id='"+direction+"PreviewActiveX' width='"+w+"' height='"+h+"' "+
						"name='"+direction+"PreviewActiveX' align='center' wndtype='1' playmode='normal'>";
					var szURL = "rtsp://${ip}:${port}/ISAPI/streaming/channels/101?auth=${auth}";
					var pwd = ii.equipment_r_c_validate_password;
		            var userName = ii.equipment_r_c_validate_name;
		            var str = Base64.encode(userName + ":" + pwd);
		            //var str = userName + ":" + pwd;
		            var ip = ii.equipment_recognition_camera_ip;
		            var port = ii.equipment_recognition_camera_port;
		            var url = szURL.replace("${ip}",ip)
		                .replace("${port}",port)
		                .replace("${auth}",str);
		            avalon.log("摄像头流地址",url);
		            var PreviewActiveX = document.getElementById(direction + "PreviewActiveX");
		            if(PreviewActiveX.HWP_Play){
		            	var re = PreviewActiveX.HWP_Play(url,str, 0, "", "");
			            if(re === -1){
			                Index.alert("连接失败,请检查摄像头的IP地址、端口配置是否正确");
			            }
		            }else{
		            	//Index.alert("请先安装摄像头浏览器插件");
		            	avalon.log("请先安装摄像头浏览器插件");
		            }
					break;
				}
			}
	}
	var cameraData;
	var content = avalon.define({
		$id : "content",
		toggleVideo : function(direction){
			var str = direction === 'in' ? "showInVideo" : "showOutVideo";
			if(content[str]){
				document.getElementById(direction + "VideoContainer").innerHTML = '';
				content[str] = false;
			}else{
				content[str] = true;
				createVideo(direction);
			}
		},
		inIsAlwaysOpenMode : false,
		outIsAlwaysOpenMode : false,
		$inModeTipOpts : {
			content : "切换为常开模式",
			position : "top"
		},
		$outModeTipOpts : {
			content : "切换为常开模式",
			position : "top"
		},
		//入场 常开 正常模式切换
		toggleMode : function(d){
			var list = d + "List";
			var index = d + "Index";
			var mode = d + "IsAlwaysOpenMode";
			Index.websocket.send({
				command : "CONSTANT_OPEN_CONTROL",
				biz_content : {
					entrance_channel_seq : content[list][content[index]].entrance_channel_seq,
					type : content[mode] ? "0" : "1"
				}
			},document.body,function(data){
				if(data.code === '0'){
					Index.alert("操作成功");
					content[mode] = !content[mode];
					avalon.vmodels["$" + d + "ModeTip"].content = content[mode] ? "切换为正常模式" : "切换为常开模式";
				}else{
					Index.alert("操作失败");
				}
			});
		},
		showInVideo : false,
		showOutVideo : false,
		showCarlist : function(){
			if(content.outCarCost.indexOf("已付费") !== -1 || content.outCarCost.indexOf("异常离场") !== -1){
				return Index.alert("该车辆已付费出场，无需再匹配");
			}
			if(!content.outCarNum || content.outCarNum === '--'){
				return Index.alert("暂无出场车辆");
			}
			avalon.vmodels.$carListDialog.open();
		},
		doCorrect : function(){
			var $win = avalon.vmodels.$correctWin;
			$win.carNumImg = content.inCarImg;
			$win.inCarNum = content.inCarNum;
			$win.curChoose = content.inCarNum.charAt(0);
			$win.correctNum = content.inCarNum.substring(1);
			$win.open();
		},
		catchCamera : function(d){
			var list = d + "List";
			var index = d + "Index";
			var seq = content[list][content[index]].entrance_channel_seq;
			for(var i=0,ii;ii=cameraData[i++];){
				if(ii.entrance_channel_seq === seq){
					var ip = ii.equipment_recognition_camera_ip;
					Index.websocket.send({
						command : "RECOGNITION_CAMERA_CONTROL",
						biz_content : {
							entrance_channel_seq : seq,
							equipment_recognition_camera_ip : ip
						}
					},document.body,function(data){
						if(data.code === '0'){
							Index.alert("操作成功");
						}else{
							Index.alert("操作失败");
						}
					});
					return;
				}
			}
		},
		inPicIndex : 0,
		outPicIndex : 0,
		changePicIndex : function(d,t){
			var list = d + "List";
			var indexStr = d + "Index";
			var channel = content[list][content[indexStr]].entrance_channel_seq;
			var index = content[d + "PicIndex"] + t;
			if(index < 0){
				Index.alert("该通道消息已经是最新的");
				return;
			}
			Index.websocket.send({
				command : "GET_LAST_REAL_TIME_CAR",
				biz_content : {
					channel : channel,
					sequence : index + ""
				}
			},document.body,function(data){
				if(data.code === '0' && data.msg === "ok"){
					GET_LAST_REAL_TIME_CAR_RETURN(data);
					content[d + "PicIndex"] = index; 
				}else{
					Index.alert("没有上一条记录了");
				}
			});
		},
		reCamera : function(){
			avalon.vmodels.$recameraWin.open();
		},
		$recameraWinOpts : {
			title : "入场补录",
			car_license_number : "",
			car_license_number_mes : "",
			provinceData : [
				[['京','津','粤','沪'],['浙','苏','湘','渝']],
				[['云','豫','皖','陕'],['桂','新','青','琼']],
				[['闽','蒙','辽','宁'],['鲁','晋','吉','冀']],
				[['黑','甘','鄂','赣'],['贵','川','藏']]
			],
			curChoose : "粤",
			doChoose : function(j){
				avalon.vmodels.$recameraWin.curChoose = j;
			},
			buttons : [{
				text : "确定",
				theme : "primary",
				handler : function(vmodel){
					if(vmodel.car_license_number === ''){
						return vmodel.car_license_number_mes = "请输入车牌号码";
					}
					Index.websocket.send({
						command : "SYNCHRONIZATION_REAL_TIME_CAR_IN",
						biz_content : {
							real_time_list : [{
								car_license_number : vmodel.curChoose + vmodel.car_license_number,
								enter_car_license_number : vmodel.curChoose + vmodel.car_license_number,
								enter_time : avalon.vmodels.$recameraWin_startDate.value,
								enter_channel : content.inList[content.inIndex].entrance_channel_seq,
								enter_vip_type : '0',
								pass_type : '1',
								enter_type : '1',
								enter_speed : '0',
								enter_car_license_color : '0',
								enter_car_color : '0',
								enter_car_logo : "0",
								enter_car_license_type : '0',
								enter_car_type : '0',
								enter_recognition_confidence : '100',
								in_operate_name : Index.top.accountName,
								in_operate_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),
								is_correct : "0",
								correct_confidence : "0",
								enter_car_full_picture : "",
								enter_car_license_picture : '',
								correct_license_number : '',
								last_correct_name : '',
								last_correct_time : '',
								remark : ''
							}]
						}
					},vmodel.widgetElement,function(data){
						if(data.code === '0'){
							Index.alert("补录成功");
							vmodel.close();
						}else{
							Index.alert("补录失败");
						}
					});
				}
			},{
				text : "取消",
				close : true
			}],
			afterShow : function(isInit,vmodel){
				if(isInit){
					Index.initWidget('recameraWin-startDate',"date,$recameraWin_startDate,$",content);
					vmodel.$watch("car_license_number",function(){
						vmodel.car_license_number_mes = '';
					});
				}
				avalon.vmodels.$recameraWin_startDate.setValue(new Date());
				vmodel.car_license_number = '';
			}
		},
		$correctWinOpts : {
			title : "校正车牌",
			buttons : [{
				text : '非机动车',theme : "danger",handler : function(vmodel){
					doCorrectCarNum(content.inCarNum,content.inTime,
						"非机动车" + avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),vmodel);
				}
			},{
				text : '无牌车',theme : "primary",handler : function(vmodel){
					doCorrectCarNum(content.inCarNum,content.inTime,
						"无牌车" + avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),vmodel);
				}
			},{
				text : "确认校正",theme : "success",handler : function(vmodel){
					doCorrectCarNum(content.inCarNum,content.inTime,
						vmodel.curChoose + vmodel.correctNum,vmodel);
				}
			},{
				text : "取消",close : true
			}],
			provinceData : [
				[['京','津','粤','泸'],['浙','苏','湘','渝']],
				[['云','豫','皖','陕'],['桂','新','青','琼']],
				[['闽','蒙','辽','宁'],['鲁','晋','吉','冀']],
				[['黑','甘','鄂','赣'],['贵','川','藏']]
			],
			curChoose : "粤",
			inCarNum : '--',
			correctNum : "",
			doChoose : function(j){
				avalon.vmodels.$correctWin.curChoose = j;
			},
			carNumImg : "image/no-car.png"
		},
		$carListDialogOpts : {
			title : "在场车辆匹配列表",
			carNum : "",
			mes : "结束日期不能少于开始日期",
			keydown : function(e){
				if(e.keyCode === 13){
					avalon.vmodels.$carListDialog.searchCar();
				}
			},
			searchCar : function(){
				if(REAL_TIME_CAR_LIST){
					var result = [];
					var vmodel = avalon.vmodels.$carListDialog;
					var sDate = avalon.vmodels.$startDate.value;
					var eDate = avalon.vmodels.$endDate.value;
					var carNum = vmodel.carNum;
					for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
						if(carNum && item.car_license_number.indexOf(carNum) === -1){
							continue;
						}
						if(sDate && item.enter_time < sDate){
							continue;
						}
						if(eDate && item.enter_time > eDate){
							continue;
						}
						result.push(item);
					}
					matchNum(content.outCarNum,result);
					avalon.vmodels.$carList.loadFrontPageData(result);
				}
			},
			noCarNumFind : function(){
				if(REAL_TIME_CAR_LIST){
					var result = [];
					var vmodel = avalon.vmodels.$carListDialog;
					var sDate = avalon.vmodels.$startDate.value;
					var eDate = avalon.vmodels.$endDate.value;
					for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
						if(item.car_license_number.indexOf('无牌车') === -1 &&
							item.car_license_number.indexOf("未识别") === -1){
							continue;
						}
						if(sDate && item.enter_time < sDate){
							continue;
						}
						if(eDate && item.enter_time > eDate){
							continue;
						}
						result.push(item);
					}
					avalon.vmodels.$carList.loadFrontPageData(result);
				}
			},
			afterShow : function(isInit){
				var element = this;
				if(isInit){
					Index.initWidget('realCarList',"table,$carList,$carListOpts",content);
					Index.initWidget('startDate',"date,$startDate,$",content);
					Index.initWidget('endDate',"date,$endDate,$",content);
				}
				Index.websocket.send({
					command : "GET_REAL_TIME_CAR"
				},element,function(data){
					if(data.code === "0" && data.msg === "ok"){
						REAL_TIME_CAR_LIST = data.real_time_list;
						var obj = Index.getRange(REAL_TIME_CAR_LIST,'enter_time');
						if(obj && obj.min && obj.max){
							avalon.vmodels.$startDate.setValue(new Date(obj.min.replace(/\-/g,'/')));
							avalon.vmodels.$endDate.setValue(new Date(obj.max.replace(/\-/g,'/')));
						}else{
							var now = new Date();
							avalon.vmodels.$startDate.setValue(now);
							avalon.vmodels.$endDate.setValue(now);
						}
						matchNum(content.outCarNum,REAL_TIME_CAR_LIST);
						avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST);
					}
				});
			}
		},
		$startDateOpts : {},
		$carListOpts : {
			title : "在场车辆列表",
			columns : [
				{title : "车牌图片",field : "enter_car_license_picture",width : 100,
					formatter : function(v){
						return "<img onerror='Index.onImgError(this);' width='100' ms-click='showPic(item)' alt='车牌图片' src='"+
						Index.dealPicSrc(v) +
						"' title='点击查看大图' class='img-rounded img-responsive cpointer'>";
					}
				},
				{title : "车牌号",field : "car_license_number"},
				{title : "入场时间",field : "enter_time"},
				{title : "操作",field : "operate",
					formatter : function(){
						return "<button ms-click='doMatch(item)' class='btn btn-primary btn-lg' type='button'>匹配</button>";
					}
				}
			],
			//匹配车牌
			doMatch : function(item){
				avalon.vmodels.$carListDialog.close();
				content.outInCarNum = item.car_license_number;
				content.outInCarImg = Index.dealPicSrc(item.enter_car_license_picture);
				content.outInCarTime = item.enter_time;
				content.outCarType = Index.mData.getVipType(item.enter_vip_type);
				getCharge(item.car_license_number,item.enter_time,content.outCarTime);
			},
			//查看大图
			showPic : function(item){
				avalon.vmodels.$picDialog.open();
				avalon.vmodels.$picDialog.picSrc = Index.dealPicSrc(item.enter_car_full_picture);
			}
		},
		$picDialogOpts : {
			title : "查看大图",
			picSrc : Index.noCarImgSrc
		},
		//付停车费
		payMoney : function(){
			if(content.outCarCost.indexOf("已付费") !== -1 || content.outCarCost.indexOf("异常离场") !== -1){
				return Index.alert("不能为离场车辆付费，请确认");
			}
			if(!Index.isCarNum(content.outCarNum)){
				return Index.alert("暂无出场车辆");
			}
			if(!Index.isCarNum(content.outInCarNum)){
				return Index.alert("请先匹配入场车牌");
			}
			//第一步：下发手动匹配接口P9.1
			Index.websocket.send({
				command : "CAR_IN_OUT_MATCH",
				biz_content : {
					enter_car_license_number : content.outInCarNum === '--' ? "" : content.outInCarNum,
					enter_car_card_number : "",
					enter_time : Index.getEmptyStr(content.outInCarTime),
					leave_car_license_number : content.outCarNum,
					leave_car_card_number : "",
					leave_time : content.outCarTime
				}
			},document.body,function(data){
				if(data.code === '0' && data.msg === "ok"){
					//第二步：下发收费接口P6.9 
					var discount_time_min = "";
					for(var i=0,ii=content.discountList.length;i<ii;i++){
						var item = content.discountList[i];
						if(item.discount_name === content.outDiscount){
							discount_time_min = item.discount_time_min;
							break;
						}
					}
					Index.websocket.send({
						command : "SYNCHRONIZATION_PREPAYMENT",
						biz_content : {
							prepayment_list : [{
								car_license_number : content.outInCarNum,
								enter_car_card_number : "",
								enter_time : Index.getEmptyStr(content.outInCarTime),
								discount_name : content.outDiscount,
								discount_amount : "",
								discount_time_min : discount_time_min,
								prepayment_total_amount : content.total_amount,
								actual_receivable : content.outCarCostActual,
								received_amount : content.outCarCostActual,
								payment_mode : "0",
								pay_origin : "web",
								last_prepayment_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),
								operator : Index.top.accountName
							}]
						}
					},document.body,function(data){
						if(data.code === '0' && data.msg === "ok"){
							//第三步，下发开闸指令：P4.2
							toggleDoor(content.outList[content.outIndex].entrance_channel_seq,
								content.outInCarNum,content.outInCarTime,document.body,'1',function(){
									//重新获取通道最新消息
									getNewestChannelData();
								});
							
						}
					});
				}else{
					//匹配失败
					Index.alert("匹配失败，请确认出入场车牌是否一样");
				}
			});
		},
		//出车确认放行
		outSureOpen : function(){
			//开闸指令
			//下发手动匹配接口P9.1
			Index.websocket.send({
				command : "CAR_IN_OUT_MATCH",
				biz_content : {
					enter_car_license_number : content.outInCarNum === '--' ? "" : content.outInCarNum,
					enter_car_card_number : "",
					enter_time : Index.getEmptyStr(content.outInCarTime),
					leave_car_license_number : content.outCarNum,
					leave_car_card_number : "",
					leave_time : content.outCarTime
				}
			},document.body,function(data){
				if(data.code === '0' && data.msg === "ok"){
					var outCar = content.outList[content.outIndex];
					toggleDoor(outCar.entrance_channel_seq,
						content.outInCarNum,content.outInCarTime,document.body,'1',function(){
							//重新获取通道最新消息
							getNewestChannelData();
						});
				}
			});
		},
		//入车确认放行
		inSureOpen : function(){
			//开闸指令
			var inCar = content.inList[content.inIndex];
			toggleDoor(inCar.entrance_channel_seq,content.inCarNum,content.inTime,document.body);
		},
		outCloseDoor : function(){
			var outCar = content.outList[content.outIndex];
			toggleDoor(outCar.entrance_channel_seq,content.outInCarNum,content.outInCarTime,document.body,'2');
		},
		inCloseDoor : function(){
			var inCar = content.inList[content.inIndex];
			toggleDoor(inCar.entrance_channel_seq,content.inCarNum,content.inTime,document.body,'2');
		},
		inList : [],
		outList : [],
		inIndex : 0,
		outIndex : 0,
		inTime : "--",
		inCarNum : "--",
		inCarType : "--",
		inCarFullImg : Index.noCarImgSrc,
		inCarImg : Index.noCarImgSrc,
		outCarFullImg : Index.noCarImgSrc,
		outInCarNum : "--",
		outInCarImg : Index.noCarImgSrc,
		outCarNum : "--",
		outCarImg : Index.noCarImgSrc,
		outInCarTime : "--",
		outCarTime : "--",
		outCarType : "--",
		outCarCost : "--",
		outCarCostActual : '',
		total_amount : '',
		outDiscount : '无优惠',
		discountList : [{discount_seq : "",discount_name : "无优惠",discount_time_min : "0"}],
		changeIndex : function(direction){
			var str = direction === 'in' ? "showInVideo" : "showOutVideo";
			if(content[str]){
				createVideo(direction);
				//content.toggleVideo(direction);
			}
			Index.websocket.send({
				command : "GET_LAST_REAL_TIME_CAR",
				biz_content : {
					channel : content[direction + "List"][content[direction + "Index"]].entrance_channel_seq
				}
			},document.body,GET_LAST_REAL_TIME_CAR_RETURN);
		}
	});
	//切换优惠 重新下发获取金额指令
	content.$watch("outDiscount",function(newVal){
		if(content.outCarCost.indexOf("已付费") !== -1 || content.outCarCost.indexOf("异常离场") !== -1){
			return;
		}
		if(content.outInCarNum && content.outInCarNum !== '--'){
			getCharge(content.outInCarNum,content.outInCarTime,content.outCarTime);
		}
	});
	avalon.scan();
	//出入车推送处理
	(function(){
		//储存通道的最新数据 entrance_channel_seq
		var obj = {};
		//var hasIn = false,hasOut = false;///////////////////////////////
		Index.websocket.callbacks.PUSH_CHANNEL_INFO = function(data){
			//if(hasIn && hasOut) return;///////////////////////////////////////
			if(data.code === '0' && data.msg === "ok"){
				var channelData = obj[data.channel] = {};
				//该通道号是进还是出
				var isIn = false;
				avalon.each(content.inList,function(i,v){
					if(v.entrance_channel_seq === data.channel){
						isIn = true;
						return false;
					}
				});
				var enterCar = data.enter_car_list;
				if(enterCar && enterCar.length > 0){
					channelData.enterCar = enterCar[0];
				}else{
					channelData.enterCar = null;
				}
				if(!isIn){
					//if(hasOut) return;////////////////////////////////
					//hasOut = true;///////////////////////////////////////
					//出场
					var leaveCar = data.leave_car_list;
					if(leaveCar && leaveCar.length > 0){
						channelData.leaveCar = leaveCar[0];
					}else{
						channelData.leaveCar = null;
					}
					content.$fire("outIndex",content.outIndex);
					avalon.log("有车出场了:",channelData);
					if(channelData.enterCar === null){
						//没匹配
						avalon.vmodels.$carListDialog.open();
					}
				}else{
					//if(hasIn) return;///////////////////////////////
					//hasIn = true;///////////////////////////////////////
					content.$fire("inIndex",content.inIndex);
					avalon.log("有车入场了:",channelData);
				}
			}
		};
		//切换入场通道口处理
		content.$watch("inIndex",function(newVal){
			var item = content.inList[newVal];
			var target = obj[item.entrance_channel_seq];
			if(target){
				var enter = target.enterCar;
				target = {
					inTime : enter.enter_time,
					inCarNum : enter.car_license_number,
					inCarType : Index.mData.getVipType(enter.enter_vip_type),
					inCarFullImg : Index.dealPicSrc(enter.enter_car_full_picture),
					inCarImg : Index.dealPicSrc(enter.enter_car_license_picture),
					inIsAlwaysOpenMode : !!item.constant_open_mode
				};
			}else{
				target = {
					inTime : "--",
					inCarNum : "--",
					inCarType : "--",
					inCarFullImg : Index.noCarImgSrc,
					inCarImg : Index.noCarImgSrc,
					inIsAlwaysOpenMode : !!item.constant_open_mode
				};
			}
			avalon.mix(content,target);
		});
		//切换出场通道口处理
		content.$watch("outIndex",function(newVal){
			var item = content.outList[newVal];
			var target = obj[item.entrance_channel_seq];
			if(target){
				var enter = target.enterCar || {
					car_license_number : "--",
					enter_time : "--"
				};
				if(enter.enter_car_license_picture){
					var outInCarImg = Index.dealPicSrc(enter.enter_car_license_picture);
				}else{
					outInCarImg = Index.noCarImgSrc;
				}
				var leave = target.leaveCar;
				var model = {
					outCarFullImg : Index.dealPicSrc(leave.leave_car_full_picture),
					outInCarNum : enter.car_license_number,
					outInCarImg : outInCarImg,
					outInCarTime : enter.enter_time,
					outCarNum : leave.leave_car_license_number,
					outCarImg : Index.dealPicSrc(leave.leave_car_license_picture),
					outCarTime : leave.leave_time,
					outCarType : Index.mData.getVipType(leave.leave_vip_type),
					outCarCost : "--",
					outIsAlwaysOpenMode : !!item.constant_open_mode
				};
				if(leave.leave_type !== '0'){
					model.outCarCost = leave.leave_type === '1' ? "已付费" : "异常离场";
				}else{
					if(target.enterCar){
						model.outCarCost = "获取中......";
						//匹配到入场记录 马上发送GET_CHARGE指令
						getCharge(leave.leave_car_license_number,enter.enter_time,leave.leave_time);
					}else{
						model.outCarCost = "请先匹配入场车牌";
					}
				}
			}else{
				model = {
					outCarFullImg : Index.noCarImgSrc,
					outInCarNum : "--",
					outInCarImg : Index.noCarImgSrc,
					outCarNum : "--",
					outCarImg : Index.noCarImgSrc,
					outInCarTime : "--",
					outCarTime : "--",
					outCarType : "--",
					outCarCost : "--",
					outIsAlwaysOpenMode : !!item.constant_open_mode
				};
			}
			avalon.mix(content,model);
		});
		//基本信息指令
		Index.websocket.send({
			command : "GET_PARKING_LOT_BASE_DATE",
			biz_content : {
				request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
			}
		},document.body,function(data){
			Index.init();
			if(data.code === '0' && data.msg === "ok"){
				cameraData = data.camera_list;
				//获取优惠信息
				Index.websocket.send({
					command : "GET_DISCOUNT"
				},document.body,function(discountData){
					if(discountData.code === "0" && discountData.msg === "ok"){
						var list = discountData.discount_list;
						content.discountList.pushArray(list);
						//获取最新的推送信息
						var entranceList = data.entrance_channel_list;
						if(!entranceList || entranceList.length === 0){
							avalon.log("entrance_channel_list为空或没数据！");
							return;
						}
						var inList = [];
						var outList = [];
						avalon.each(entranceList,function(i,d){
							if(d.entrance_type === '1'){
								inList.push(d);
							}else if(d.entrance_type === '2'){
								outList.push(d);
							}
						});
						content.inList = inList;
						content.outList = outList;
						//获取完基本信息后 发送获取通道最新信息的指令
						getNewestChannelData();
					}
				});
			}
		});
	})();
	//发送获取通道最新信息的指令
	function getNewestChannelData(){
		if(content.inList.length > 0){
			Index.websocket.send({
				command : "GET_LAST_REAL_TIME_CAR",
				biz_content : {
					channel : content.inList[0].entrance_channel_seq
				}
			},document.body,GET_LAST_REAL_TIME_CAR_RETURN);
		}
		if(content.outList.length > 0){
			Index.websocket.send({
				command : "GET_LAST_REAL_TIME_CAR",
				biz_content : {
					channel : content.outList[0].entrance_channel_seq
				}
			},document.body,GET_LAST_REAL_TIME_CAR_RETURN);
		}
	}
	function GET_LAST_REAL_TIME_CAR_RETURN(data){
		if(data.code === '0' && data.msg === "ok"){
			var leave = data.leave_car_list;
			if(!leave || leave.length === 0){
				//入场的最新消息
				var enter = data.enter_car_list;
				if(enter && enter.length > 0){
					enter = enter[0];
					Index.websocket.callbacks.PUSH_CHANNEL_INFO({
						code : "0",
						msg : "ok",
						channel : enter.enter_channel,
						enter_car_list : data.enter_car_list
					});
				}
			}else{
				//出场的最新消息
				leave = leave[0];
				Index.websocket.callbacks.PUSH_CHANNEL_INFO({
					code : "0",
					msg : "ok",
					channel : leave.leave_channel,
					enter_car_list : data.enter_car_list,
					leave_car_list : data.leave_car_list
				});
			}
		}
	}
	//录像resize
	var cameraHelper = (function(){
		var factor = 1360 / 1024;
		avalon.bind(window,"resize",function(){
			cameraResizeHandler("in");
			cameraResizeHandler("out");
		});
		var inter = {
			"in" : null,
			"out" : null
		};
		function cameraResizeHandler(direction){
			var str = direction === 'in' ? "showInVideo" : "showOutVideo";
			if(content[str]){
				/*var embed = document.getElementById(direction + "PreviewActiveX");
				var p = embed.parentNode;
				var w = avalon(p).width();
				var h = parseInt(w / factor);
				embed.height = h;
				embed.width = w;
				clearTimeout(inter[direction]);
				var container = document.getElementById(direction + "VideoContainer");
				if(container.innerHTML){
					var factor = 1360 / 1024;
					var w = avalon(container).width();
					var h = parseInt(w / factor);
					container.innerHTML = '<div style="width:'+w+'px;height:'+h+'px;background-color:#333"></div>';
				}*/
				clearVideo(direction);
				inter[direction] = setTimeout(function(){
					content[str] && createVideo(direction);
				},500);
			}
		}
		function clearVideo(direction){
			var str = direction === 'in' ? "showInVideo" : "showOutVideo";
			if(content[str]){
				var container = document.getElementById(direction + "VideoContainer");
				clearTimeout(inter[direction]);
				if(container.innerHTML){
					var factor = 1360 / 1024;
					var w = avalon(container).width();
					var h = parseInt(w / factor);
					container.innerHTML = '<div style="width:'+w+'px;height:'+h+'px;background-color:#333"></div>';
				}
			}
		}
		function beforeShow(){
			clearVideo("in");
			clearVideo("out");
		}
		function afterClose(){
			content.showInVideo && createVideo('in');
			content.showOutVideo && createVideo('out');
		}
		return {
			cameraResizeHandler : cameraResizeHandler,
			beforeShow : beforeShow,
			afterClose : afterClose
		};
	})();
});