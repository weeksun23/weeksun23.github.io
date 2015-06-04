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
	//开闸
	function openDoor(seq,car_license_number){
		var time = avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss");
		Index.websocket.send({
			command : "CONVERTOR_CONTROL",
			biz_content : {
				entrance_channel_seq : seq,
				control_type : "1",
				car_license_number : "",
				time : time,
				opera_name : localStorage.getItem("curAccount"),
				opera_time : time
			}
		});
	}
	Index.websocket.callbacks.CONVERTOR_CONTROL_RETURN = function(data){
		avalon(document.body).loading(true);
		Index.alert("开闸成功");
	};
	var content = avalon.define({
		$id : "content",
		showCarlist : function(){
			if(!content.outCarNum || content.outCarNum === '--'){
				return Index.alert("暂无出场车辆");
			}
			avalon.vmodels.$carListDialog.open();
		},
		$carListDialogOpts : {
			title : "在场车辆匹配列表",
			sDate : null,
			eDate : null,
			sDateStr : "",
			eDateStr : "",
			carNum : "",
			mes : "结束日期不能少于开始日期",
			searchCar : function(){
				if(REAL_TIME_CAR_LIST){
					var result = [];
					var vmodel = avalon.vmodels.$carListDialog;
					var sDate = vmodel.sDateStr;
					var eDate = vmodel.eDateStr;
					var carNum = vmodel.carNum;
					avalon.log(sDate,eDate,carNum);
					for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
						if(carNum && item.enter_car_license_number.indexOf(carNum) === -1){
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
					avalon.log(result);
					avalon.vmodels.$carList.loadFrontPageData(result);
				}
			},
			noCarNumFind : function(){
				if(REAL_TIME_CAR_LIST){
					var result = [];
					var vmodel = avalon.vmodels.$carListDialog;
					var sDate = vmodel.sDateStr;
					var eDate = vmodel.eDateStr;
					for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
						if(item.enter_car_license_number.indexOf('无牌车') === -1 &&
							item.enter_car_license_number.indexOf("未识别") === -1){
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
					avalon.log(result);
					avalon.vmodels.$carList.loadFrontPageData(result);
				}
			},
			afterShow : function(isInit){
				var element = this;
				if(isInit){
					Index.initDatePickerToVM($("#sDatePicker"),avalon.vmodels.$carListDialog,"sDate");
					Index.initDatePickerToVM($("#eDatePicker"),avalon.vmodels.$carListDialog,"eDate");
					Index.websocket.callbacks.GET_REAL_TIME_CAR_RETURN = function(data){
						avalon(element).loading(true);
						if(data.code === "0" && data.msg === "ok"){
							REAL_TIME_CAR_LIST = data.real_time_list;
							//avalon.log(REAL_TIME_CAR_LIST);
							matchNum(content.outCarNum,REAL_TIME_CAR_LIST);
							//avalon.log(REAL_TIME_CAR_LIST);
							avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST);
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
						return "<img ms-click='showPic(item)' alt='车牌图片' src='"+
						Index.websocket.plateImgUrl + v + "?" + (+new Date) +
						"' title='点击查看大图' class='img-rounded img-responsive cpointer'>";
					}
				},
				{title : "车牌号",field : "enter_car_license_number"},
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
				content.outInCarNum = item.enter_car_license_number;
				content.outInCarImg = Index.websocket.plateImgUrl + 
					item.enter_car_license_picture + "?" + (+new Date);
				content.outInCarTime = item.enter_time;
				getCharge(item.enter_car_license_number,item.enter_time,content.outCarTime);
			},
			//查看大图
			showPic : function(item){
				avalon.vmodels.$picDialog.open();
				avalon.vmodels.$picDialog.picSrc = Index.websocket.fullImgUrl + 
					item.enter_car_full_picture + "?" + (+new Date);
			}
		},
		$picDialogOpts : {
			title : "查看大图",
			picSrc : Index.noCarImgSrc
		},
		//付停车费
		payMoney : function(){
			if(!Index.isCarNum(content.outCarNum)){
				return Index.alert("暂无出场车辆");
			}
			if(!Index.isCarNum(content.outInCarNum)){
				return Index.alert("请先匹配入场车牌");
			}
			//手动匹配
			Index.websocket.send({
				command : "CAR_IN_OUT_MATCH",
				biz_content : {
					enter_car_license_number : content.outInCarNum,
					enter_car_card_number : "",
					enter_time : content.outInCarTime,
					leave_car_license_number : content.outCarNum,
					leave_car_card_number : "",
					leave_time : content.outCarTime
				}
			},document.body);
		},
		//出车确认放行
		outSureOpen : function(){
			//开闸指令
			avalon(document.body).loading();
			openDoor(content.outList[content.outIndex].entrance_channel_seq,"");
		},
		//入车确认放行
		inSureOpen : function(){
			//开闸指令
			avalon(document.body).loading();
			openDoor(content.inList[content.inIndex].entrance_channel_seq,"");
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
		total_amount : '',
		outDiscount : '优惠3小时'
	});
	avalon.scan();
	//出入车推送处理
	(function(){
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
				}
				if(!isIn){
					//if(hasOut) return;////////////////////////////////
					//hasOut = true;///////////////////////////////////////
					//出场
					var leaveCar = data.leave_car_list;
					if(leaveCar && leaveCar.length > 0){
						channelData.leaveCar = leaveCar[0];
					}
					content.$fire("outIndex",content.outIndex);
					avalon.log("有车出场了:",channelData);
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
	//手动匹配
	Index.websocket.callbacks.CAR_IN_OUT_MATCH_RETURN = function(data){
		if(data.code === '0' && data.msg === "ok"){
			//匹配成功 下发收费接口
			Index.websocket.send({
				command : "SYNCHRONIZATION_PREPAYMENT",
				biz_content : {
					prepayment_list : [{
						car_license_number : content.outCarNum,
						enter_car_card_number : "",
						enter_time : content.outInCarTime,
						discount_name : content.outDiscount,
						discount_amount : "",
						discount_time_min : "",
						prepayment_total_amount : content.total_amount,
						actual_receivable : content.outCarCost,
						received_amount : content.outCarCost,
						payment_mode : "0",
						pay_origin : "web",
						last_prepayment_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
					}]
				}
			});
		}else{
			avalon(document.body).loading(true);
			//匹配失败
			Index.alert("匹配失败，请确认出入场车牌是否一样");
		}
	};
	//第一步：下发手动匹配接口P9.1，第二步：下发收费接口P6.9 第三步，下发开闸指令：P4.2
	
	//收费接口回调
	Index.websocket.callbacks.SYNCHRONIZATION_PREPAYMENT_RETURN = function(data){
		if(data.code === '0' && data.msg === "ok"){
			//开闸指令
			openDoor(content.outList[content.outIndex].entrance_channel_seq,content.outCarNum);
		}else{
			avalon(document.body).loading(true);
		}
	};
	Index.websocket.callbacks.GET_CHARGE_RETURN = function(data){
		if(data.code === '0' && data.msg === "ok"){
			content.outCarCost = data.supplementary;
			content.total_amount = data.total_amount;
		}
	};
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body);
});