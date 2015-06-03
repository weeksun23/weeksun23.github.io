require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
require([
	"common/index",
	"common/tooltip/avalon.tooltip",
	"common/table/avalon.table",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 0;
	var content = avalon.define({
		$id : "content",
		showCarlist : function(){
			avalon.vmodels.$carListDialog.open();
		},
		$carListDialogOpts : {
			title : "在场车辆匹配列表",
			sDate : null,
			eDate : null,
			mes : "结束日期不能少于开始日期",
			afterShow : function(isInit){
				var element = this;
				if(isInit){
					Index.initDatePickerToVM($("#sDatePicker"),avalon.vmodels.$carListDialog,"sDate");
					Index.initDatePickerToVM($("#eDatePicker"),avalon.vmodels.$carListDialog,"eDate");
					Index.websocket.callbacks.GET_REAL_TIME_CAR_RETURN = function(data){
						avalon(element).loading(true);
						if(data.code === "0" && data.msg === "ok"){
							avalon.vmodels.$carList.loadFrontPageData(data.real_time_list);
						}
					};
					var el = document.querySelector("#realCarList");
					el.setAttribute("ms-widget","table,$carList,$carListOpts");
					avalon.scan(el,content);
				}
				Index.websocket.send({
					command : "GET_REAL_TIME_CAR"
				},element);
			}
		},
		$carListOpts : {
			title : "在场车辆列表",
			columns : [
				{title : "车牌图片",field : "enter_car_license_picture",width : 100,
					formatter : function(v){
						return "<img ms-click='showPic' alt='车牌图片' src='"+
						Index.websocket.plateImgUrl + v + "?" + (+new Date) +
						"' title='点击查看大图' class='img-rounded img-responsive cpointer'>";
					}
				},
				{title : "车牌号",field : "enter_car_license_number"},
				{title : "入场时间",field : "enter_time"},
				{title : "操作",field : "operate",
					formatter : function(){
						return "<button class='btn btn-primary btn-lg' type='button'>匹配</button>";
					}
				}
			]
		},
		showPic : function(){
			avalon.vmodels.$picDialog.open();
		},
		$picDialogOpts : {
			title : "查看大图",
			content : "<img src='image/full.jpg' alt='车辆大图' class='img-responsive img-rounded'/>"
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
		outCarCost : "--"
	});
	avalon.scan();
	(function(){
		function getCharge(car_license_number,enter_time,leave_time){
			Index.websocket.send({
				command : "GET_CHARGE",
				biz_content : {
					car_license_number : car_license_number,
					car_card_number : "",
					enter_time : enter_time,
					leave_time : leave_time,
					request_origin : "web"
				}
			});
		}
		//储存通道的最新数据 entrance_channel_seq
		var obj = {};
		Index.websocket.callbacks.GET_PARKING_LOT_BASE_DATE_RETURN = function(data){
			avalon(document.body).loading(true);
			if(data.code === '0' && data.msg === "ok"){
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
			}
		};
		Index.websocket.callbacks.PUSH_CHANNEL_INFO = function(data){
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
				}
				if(!isIn){
					//出场
					var leaveCar = data.leave_car_list;
					if(leaveCar && leaveCar.length > 0){
						channelData.leaveCar = leaveCar[0];
					}
					content.$fire("outIndex",content.outIndex);
					avalon.log("有车出场了:",channelData);
				}else{
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
					inCarNum : enter.enter_car_license_number,
					inCarType : Index.getCarType(enter.enter_vip_type),
					inCarFullImg : Index.websocket.fullImgUrl + enter.enter_car_full_picture + "?" + (+new Date),
					inCarImg : Index.websocket.plateImgUrl + enter.enter_car_license_picture + "?" + (+new Date)
				};
			}else{
				target = {
					inTime : "--",
					inCarNum : "--",
					inCarType : "--",
					inCarFullImg : Index.noCarImgSrc,
					inCarImg : Index.noCarImgSrc
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
					enter_car_license_number : "--",
					enter_time : "--"
				};
				if(enter.enter_car_license_picture){
					var outInCarImg = Index.websocket.plateImgUrl + enter.enter_car_license_picture + "?" + (+new Date);
				}else{
					outInCarImg = Index.noCarImgSrc;
				}
				var leave = target.leaveCar;
				var model = {
					outCarFullImg : Index.websocket.fullImgUrl + leave.leave_car_full_picture + "?" + (+new Date),
					outInCarNum : enter.enter_car_license_number,
					outInCarImg : outInCarImg,
					outInCarTime : enter.enter_time,
					outCarNum : leave.leave_car_license_number,
					outCarImg : Index.websocket.plateImgUrl + leave.leave_car_license_picture + "?" + (+new Date),
					outCarTime : leave.leave_time,
					outCarType : Index.getCarType(leave.leave_vip_type),
					outCarCost : "--"
				};
				if(target.enterCar){
					model.outCarCost = "获取中......";
					//匹配到入场记录 马上发送GET_CHARGE指令
					getCharge(leave.leave_car_license_number,enter.enter_time,leave.leave_time);
				}else{
					model.outCarCost = "请先匹配入场车牌";
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
					outCarCost : "--"
				};
			}
			avalon.mix(content,model);
		});
	})();
	Index.websocket.callbacks.GET_CHARGE_RETURN = function(data){
		if(data.code === '0' && data.msg === "ok"){
			content.outCarCost = data.supplementary;
		}
	};
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyyMMddHHmmss")
		}
	},document.body);
});