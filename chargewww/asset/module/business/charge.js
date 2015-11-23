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
	Index.top.curIndex = -1;
	var content = avalon.define({
		$id : "content",
		$carListOpts : {
			title : "车辆记录列表",
			columns : [
				{title : "车牌号",field : "car_license_number"},
				{title : "车牌图片",field : "enter_car_license_picture",align:'center',
					formatter : function(v,r,i){
						return "<img data-index='"+i+"' onerror='Index.onImgError(this)' src='" +
							Index.dealPicSrc(v) +
							"' height='30' alt='车牌图片'>";
					}
				},
				{title : "车辆类型",field : "enter_vip_type",formatter : Index.mData.getVipType,align:'center'},
				{title : "入场时间",field : "enter_time",align:'center'},
				{title : "操作",field : "oper",
					formatter : function(v,r){
						return "<a href='javascript:void(0)' ms-click='pay(item)'>付费</a>";
					}
				}
			],
			pay : function(item){
				var $paywin = avalon.vmodels.$paywin;
				$paywin.picSrc = Index.dealPicSrc(item.enter_car_full_picture);
				$paywin.car_license_number = item.car_license_number;
				$paywin.enter_vip_type = Index.mData.getVipType(item.enter_vip_type);
				$paywin.enter_time = item.enter_time;
				$paywin.enter_car_license_picture = Index.dealPicSrc(item.enter_car_license_picture);
				if($paywin.discount_list.length === 0){
					$paywin.discount_list = discount_list;
				}
				$paywin.open();
				getCharge($paywin);
			},
			onSelect : function(el){
				content.bigPicSrc = Index.dealPicSrc(el.enter_car_full_picture);
			}
		},
		bigPicSrc : "image/no-car.png",
		carnum : "",
		search : function(){
			if(REAL_TIME_CAR_LIST){
				var car_license_number = content.carnum;
				var result = [];
				for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
					if(
						(car_license_number && item.enter_car_license_number.indexOf(car_license_number) === -1)
					){
						continue;
					}
					result.push(item);
				}
				avalon.vmodels.$carList.loadFrontPageData(result);
			}
		},
		noCarNumSearch : function(){
			if(REAL_TIME_CAR_LIST){
				var result = [];
				for(var i=0,item;item=REAL_TIME_CAR_LIST[i++];){
					if(item.car_license_number.indexOf('无牌车') === -1 &&
						item.car_license_number.indexOf("未识别") === -1){
						continue;
					}
					result.push(item);
				}
				avalon.vmodels.$carList.loadFrontPageData(result);
			}
		},
		$paywinOpts : {
			car_license_number : '',
			enter_car_license_picture : 'image/no-car.png',
			enter_vip_type : '',
			enter_time : '',
			total_amount : '',
			supplementary : '',
			$total_amountActual : '',
			$supplementary : '',
			title : "付费",
			discount_list : [],
			daelDiscountNum : function(el,d){
				var _count = el._count + d;
				if(_count <= 1){
					_count = 1;
				}else if(_count >= 3){
					_count = 3;
				}
				el._count = _count;
			},
			updateDiscount : function(){
				setTimeout(function(){
					getCharge(avalon.vmodels.$paywin);
				},100);
			},
			buttons : [{
				text : "优惠扫描",
				theme : "primary",
				handler : function(){
				}
			},{
				text : "确定付费",
				theme : "primary",
				handler : function(vmodel){
					var discount_list = vmodel.discount_list;
					var totalTime = 0;
					var discount_name = [];
					for(var i=0,ii;ii=discount_list[i++];){
						if(ii._checked){
							totalTime += (+ii.discount_time_min * ii._count);
							discount_name.push(ii.discount_name + "*" + ii._count);
						}
					}
					Index.websocket.send({
						command : "SYNCHRONIZATION_PREPAYMENT",
						biz_content : {
							prepayment_list : [{
								car_license_number : vmodel.car_license_number,
								enter_car_card_number : "",
								enter_time : Index.getEmptyStr(vmodel.enter_time),
								discount_name : discount_name.join("+"),
								discount_amount : "",
								discount_time_min : totalTime,
								prepayment_total_amount : vmodel.$total_amountActual,
								actual_receivable : vmodel.$supplementary,
								received_amount : vmodel.$supplementary,
								payment_mode : "0",
								pay_origin : "center",
								last_prepayment_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),
								operator : Index.top.accountName
							}]
						}
					},document.body,function(data){
						if(data.code === '0' && data.msg === "ok"){
							Index.alert(vmodel.car_license_number + "成功付费" + vmodel.supplementary);
						}else{
							Index.alert("付费失败");
						}
						vmodel.close();
					});
				}
			}],
			picSrc : "image/no-car.png",
			afterShow : function(isInit,vmodel){
				for(var i=0,ii;ii=vmodel.discount_list[i++];){
					ii._count = 1;
					ii._checked = false;
				}
			}
		}
	});
	avalon.scan();
	var REAL_TIME_CAR_LIST;
	var discount_list;
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body,function(data){
		Index.init();
		if(data.code === '0' && data.msg === "ok"){
			loadInterval(function(){
				Index.websocket.send({
					command : "GET_DISCOUNT"
				},document.body,function(data){
					if(data.code === "0" && data.msg === "ok"){
						discount_list = data.discount_list;
						for(var i=0,ii;ii=discount_list[i++];){
							ii._checked = false;
							ii._count = 1;
						}
					}
				});
			},document.body);
		}
	});
	function load(func,area){
		Index.websocket.send({
			command : "GET_REAL_TIME_CAR"
		},area,function(data){
			if(data.code === "0" && data.msg === "ok"){
				REAL_TIME_CAR_LIST = data.real_time_list;
				REAL_TIME_CAR_LIST.sort(function(a,b){
					return Index.getDateSortResult(a,b,'enter_time');
				});
				avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST);
				func && func();
			}
		});
	}
	function loadInterval(func,area){
		load(function(){
			func && func();
			setTimeout(loadInterval,60000);
		},null);
	}
	function getCharge($paywin){
		var discount_list = $paywin.discount_list;
		var totalTime = 0;
		for(var i=0,ii;ii=discount_list[i++];){
			if(ii._checked){
				totalTime += (+ii.discount_time_min * ii._count);
			}
		}
		var enter_time = $paywin.enter_time;
		if(totalTime > 0){
			var time = new Date(enter_time.replace(/\-/g,"/")).getTime();
			totalTime = totalTime * 60 * 1000;
			enter_time = avalon.filters.date(new Date(time + totalTime),"yyyy-MM-dd HH:mm:ss");
		}
		Index.websocket.send({
			command : "GET_CHARGE",
			biz_content : {
				car_license_number : $paywin.car_license_number,
				car_card_number : "",
				enter_time : Index.getEmptyStr(enter_time),
				leave_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss"),
				request_origin : "center"
			}
		},document.body,function(data){
			if(data.code === '0' && data.msg === "ok"){
				$paywin.total_amount = Index.getMoney(data.total_amount);
				$paywin.supplementary = Index.getMoney(data.supplementary);
				$paywin.$total_amountActual = data.total_amount;
				$paywin.$supplementary = data.supplementary;
			}
		});
	}
});