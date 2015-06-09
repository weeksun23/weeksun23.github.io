require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 1;
	var REAL_TIME_CAR_LIST;
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
						(model.in_operate_name && item.in_operate_name.indexOf(model.in_operate_name))
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
				{title : "入场识别车牌",field : "enter_car_license_number"},
				{title : "车牌图片",field : "enter_car_license_picture",
					formatter : function(v,r,i){
						if(!v) return '';
						return "<img data-index='"+i+"' ms-click='showPic(item)' class='cpointer' src='" +
							Index.websocket.plateImgUrl + v + "?" + (+new Date) +
							"' height='50' alt='车牌图片' ms-widget='tooltip' data-tooltip-content='点击查看大图'>";
					}
				},
				{title : "入场时间",field : "enter_time"},
				{title : "入场通道",field : "enter_channel"},
				{title : "车辆类型",field : "enter_vip_type",formatter : Index.getCarType},
				{title : "放行模式",field : "pass_type"},
				{title : "置信度",field : "enter_recognition_confidence"},
				{title : "值班人员",field : "in_operate_name"}
			],
			correctCarNum : function(item){
				var $win = avalon.vmodels.$correctWin;
				$win.carNumImg = Index.websocket.plateImgUrl + item.enter_car_license_picture + "?" + (+new Date);
				$win.inCarNum = item.enter_car_license_number;
				$win.curChoose = item.enter_car_license_number.charAt(0);
				$win.correctNum = item.enter_car_license_number.substring(1);
				$win.open();
			},
			showPic : function(item){
				var list = avalon.vmodels.$carList.data;
				var imgs = [];
				for(var i=0,ii;ii=list[i++];){
					imgs.push({
						src : Index.websocket.fullImgUrl + ii.enter_car_full_picture + "?" + (+new Date)
					});
				}
				var $win = avalon.vmodels.$picWin;
				$win.imgs = imgs;
				$win.curIndex = +this.getAttribute("data-index");
				$win.open();
			}
		},
		$correctWinOpts : {
			title : "纠正车牌",
			buttons : [{
				text : '非机动车',theme : "danger"
			},{
				text : '无牌车',theme : "primary"
			},{
				text : "确认纠正",theme : "success"
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
		sDate : "",
		eDate : "",
		channelData : [],
		model : {
			sDateStr : "",
			eDateStr : "",
			enter_channel : "",
			enter_vip_type : "",
			car_license_number : "",
			in_operate_name : "",
			enter_recognition_confidence : ""
		}
	});
	avalon.scan();
	//获取车辆列表
	Index.websocket.send({
		command : "GET_REAL_TIME_CAR"
	},document.body,function(data){
		if(data.code === "0" && data.msg === "ok"){
			avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST = data.real_time_list);
			var channelObj = {};
			for(var i=0,ii;ii=REAL_TIME_CAR_LIST[i++];){
				channelObj[ii.enter_channel] = 1;
			}
			var arr = [];
			for(var i in channelObj){
				arr.push(i);
			}
			content.channelData = arr;
		}
	});
	Index.initDatePickerToVM($("#inTimePicker"),content,"sDate");
	Index.initDatePickerToVM($("#outTimePicker"),content,"eDate");
});