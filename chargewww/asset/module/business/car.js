require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	},
	urlArgs : "v=" + (+new Date)
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 1;
	var REAL_TIME_CAR_LIST;
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
				vmodel.close();
				getCar(avalon.vmodels.$carList.curPage);
			}else{
				Index.alert("校正失败，请重试。");
			}
		});
	}
	var content = avalon.define({
		$id : "content",
		search : function(){
			if(REAL_TIME_CAR_LIST){
				var model = content.model.$model;
				var result = [];
				for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
					if(
						(model.car_license_number && item.enter_car_license_number.indexOf(model.car_license_number) === -1) ||
						(model.sDateStr && item.enter_time < model.sDateStr) ||
						(model.eDateStr && item.enter_time > model.eDateStr) ||
						(model.enter_vip_type && model.enter_vip_type !== item.enter_vip_type) ||
						(model.enter_channel && model.enter_channel !== item.enter_channel) ||
						(model.in_operate_name && item.in_operate_name !== model.in_operate_name) ||
						(model.sBelieve && +item.enter_recognition_confidence < +model.sBelieve) ||
						(model.eBelieve && +item.enter_recognition_confidence > +model.eBelieve)
					){
						continue;
					}
					result.push(item);
				}
				avalon.vmodels.$carList.loadFrontPageData(result);
			}
		},
		$carListOpts : {
			title : "车辆列表",
			pageSize : 10,
			columns : [
				{title : "最终车牌",field : "car_license_number",
					formatter : function(v){
						return "<a href='javascript:void(0)' ms-click='correctCarNum(item)' ms-widget='tooltip' data-tooltip-content='点击纠正车牌'>" +
							v + "</a>";
					}
				},
				{title : "入场识别<br>车牌",field : "enter_car_license_number",align:'center'},
				{title : "车牌图片",field : "enter_car_license_picture",align:'center',
					formatter : function(v,r,i){
						return "<img data-index='"+i+"' onerror='Index.onImgError(this)' ms-click='showPic(item)' class='cpointer' src='" +
							Index.dealPicSrc(v) +
							"' height='30' alt='车牌图片' ms-widget='tooltip' data-tooltip-content='点击查看大图'>";
					}
				},
				{title : "入场时间",field : "enter_time",align:'center'},
				{title : "入场<br>通道",field : "enter_channel",align:'center',
					formatter : function(v){
						for(var i=0,ii;ii=entrance_channel_list[i++];){
							if(ii.entrance_channel_seq === v){
								return ii.entrance_name;
							}
						}
						return '--';
					}
				},
				{title : "车辆<br>类型",field : "enter_vip_type",formatter : Index.mData.getVipType,align:'center'},
				{title : "放行<br>模式",field : "enter_channel",align:'center',
					formatter : function(v,r){
						var type = r.enter_vip_type;
						if(type === "1"){
							var key = "normal_car_pass_mode";
						}else if(type === '2'){
							key = 'vip_car_pass_mode';
						}else if(type === '3'){
							key = 'appointment_car_pass_mode';
						}else if(type === '0'){
							key = "no_plate_pass_mode";
						}
						for(var i=0,ii;ii=entrance_channel_list[i++];){
							if(ii.entrance_channel_seq === v){
								return Index.getPassType(ii[key]);
							}
						}
						return '--';
					}
				},
				{title : "置信度",field : "enter_recognition_confidence",formatter : function(v,r){
					if(r.is_correct === "1"){
						return r.correct_confidence;
					}else{
						return v;
					}
				}},
				{title : "值班<br>人员",field : "in_operate_name",align:'center'}
			],
			correctCarNum : function(item){
				var $win = avalon.vmodels.$correctWin;
				$win.carNumImg = Index.dealPicSrc(item.enter_car_license_picture);
				$win.inCarNum = item.car_license_number;
				$win.curChoose = item.enter_car_license_number.charAt(0);
				$win.correctNum = item.enter_car_license_number.substring(1);
				$win.$curRecord = item;
				$win.open();
			},
			showPic : function(item){
				var list = avalon.vmodels.$carList.data;
				var imgs = [];
				for(var i=0,ii;ii=list[i++];){
					imgs.push({
						src : Index.dealPicSrc(ii.enter_car_full_picture)
					});
				}
				var $win = avalon.vmodels.$picWin;
				$win.imgs = imgs;
				$win.curIndex = +this.getAttribute("data-index");
				$win.open();
			}
		},
		$correctWinOpts : {
			title : "校正车牌",
			$curRecord : null,
			buttons : [{
				text : '非机动车',theme : "danger",handler : function(vmodel){
					doCorrectCarNum(vmodel.$curRecord.car_license_number,vmodel.$curRecord.enter_time,
						"非机动车" + avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),vmodel);
				}
			},{
				text : '无牌车',theme : "primary",handler : function(vmodel){
					doCorrectCarNum(vmodel.$curRecord.car_license_number,vmodel.$curRecord.enter_time,
						"无牌车" + avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),vmodel);
				}
			},{
				text : "确认校正",theme : "success",handler : function(vmodel){
					doCorrectCarNum(vmodel.$curRecord.car_license_number,vmodel.$curRecord.enter_time,
						vmodel.curChoose + vmodel.correctNum,vmodel);
				}
			},{
				text : "取消",close : true
			}],
			provinceData : [
				[['京','津','粤','沪'],['浙','苏','湘','渝']],
				[['云','豫','皖','陕'],['桂','新','青','琼']],
				[['闽','蒙','辽','宁'],['鲁','晋','吉','冀']],
				[['黑','甘','鄂','赣'],['贵','川','藏']]
			],
			curChoose : "粤",
			doChoose : function(j){
				avalon.vmodels.$correctWin.curChoose = j;
			},
			carNumImg : "image/no-car.png",
			inCarNum : "--",
			correctNum : ""
		},
		$picWinOpts : {
			title : "浏览大图",
			curIndex : 0,
			next : function(){
				var items = document.querySelectorAll("#carousel .item");
				for(var i=0,ii=items.length;i<ii;i++){
					var $item = avalon(items[i]);
					if($item.hasClass("active")){
						if(i === ii - 1){
							var j = 0;
						}else{
							j = i + 1;
						}
						$item.addClass("left");
						var next = items[j];
						next.classList.add("next");
						next.offsetWidth;
						next.classList.add("left");
						return;
					}
				}
			},
			prev : function(){
				var items = document.querySelectorAll("#carousel .item");
				for(var i=0,ii=items.length;i<ii;i++){
					var $item = avalon(items[i]);
					if($item.hasClass("active")){
						if(i === 0){
							var j = ii - 1;
						}else{
							j = i - 1;
						}
						$item.addClass("right");
						var prev = items[j];
						prev.classList.add("prev");
						prev.offsetWidth;
						prev.classList.add("right");
						return;
					}
				}
			},
			imgs : [],
			afterShow : function(isInit){
				avalon.each(document.querySelectorAll("#carousel .item"),function(i,el){
					el.addEventListener(avalon.support.transitionend,function(e){
						e.stopPropagation();
						e.preventDefault();
						if(e.target !== this) return;
						var $this = avalon(this);
						this.classList.remove('left');
						this.classList.remove("right");
						if($this.hasClass("active")){
							this.classList.remove("active");
						}else if($this.hasClass("next")){
							this.classList.remove("next");
							this.classList.add("active");
						}else if($this.hasClass("prev")){
							this.classList.remove("prev");
							this.classList.add("active");
						}
					});
				});
			}
		},
		channelData : [],
		model : {
			sDateStr : '',
			eDateStr : '',
			enter_channel : "",
			enter_vip_type : "",
			car_license_number : "",
			in_operate_name : "",
			sBelieve : "",
			eBelieve : ""
		},
		operUsers : []
	});
	avalon.scan();
	var entrance_channel_list;
	//基本信息指令
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body,function(data){
		entrance_channel_list = data.entrance_channel_list;
		getCar(1,function(){
			var channelObj = {};
			var users = {};
			for(var i=0,ii;ii=REAL_TIME_CAR_LIST[i++];){
				channelObj[ii.enter_channel] = 1;
				users[ii.in_operate_name] = 1;
			}
			//通道号
			var arr = [];
			for(var i in channelObj){
				avalon.each(entrance_channel_list,function(j,item){
					if(item.entrance_channel_seq === i){
						arr.push({
							text : item.entrance_name,
							value : i
						});
					}
				});
			}
			content.channelData = arr;
			arr = [];
			//操作人
			for(var i in users){
				arr.push(i);
			}
			content.operUsers = arr;
			//日期
			var obj = Index.getRange(REAL_TIME_CAR_LIST,"enter_time");
			if(obj){
				content.model.sDateStr = obj.min;
				content.model.eDateStr = obj.max;
			}else{
				var nowStr = avalon.filters.date(new Date(),"yyyy-MM-dd hh:mm:ss");
				content.model.sDateStr = nowStr;
				content.model.eDateStr = nowStr;
			}
			$("#inTimePicker").datetimepicker("update");
			$("#outTimePicker").datetimepicker("update");
			Index.init();
		});
	});
	//获取车辆列表
	function getCar(page,func){
		Index.websocket.send({
			command : "GET_REAL_TIME_CAR"
		},document.body,function(data){
			if(data.code === "0" && data.msg === "ok"){
				REAL_TIME_CAR_LIST = data.real_time_list,page
				REAL_TIME_CAR_LIST.sort(function(a,b){
					return Index.getDateSortResult(a,b,'enter_time');
				});
				avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST);
				/*REAL_TIME_CAR_LIST = [{
					car_license_number : "sdsd",
					enter_car_license_number : "sdrewe"
				}];
				avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST);*/
				func && func();
			}
		});
	}
	$("#inTimePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
	$("#outTimePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
});