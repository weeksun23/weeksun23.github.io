require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4",
		'html5qrcode' : "lib/html5qrcode/html5-qrcode"
	},
	shim : {
		html5qrcode : ['jquery']
	},
	urlArgs : "v=" + (+new Date)
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tooltip/avalon.tooltip"
],function(Index){
	Index.top.curIndex = -1;
	var content = avalon.define({
		$id : "content",
		parkingName : "",
		$carListOpts : {
			title : "车辆记录列表",
			columns : [
				{title : "车牌号",field : "car_license_number",
					formatter : function(v){
						return "<a href='javascript:void(0)' ms-click='correctCarNum(item)' ms-widget='tooltip' data-tooltip-content='点击纠正车牌'>" +
							v + "</a>";
					}
				},
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
			correctCarNum : function(item){
				var $win = avalon.vmodels.$correctWin;
				$win.carNumImg = Index.dealPicSrc(item.enter_car_license_picture);
				$win.inCarNum = item.car_license_number;
				$win.curChoose = item.car_license_number.charAt(0);
				$win.correctNum = item.car_license_number.substring(1);
				$win.$curRecord = item;
				$win.open();
			},
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
						(car_license_number && item.car_license_number.indexOf(car_license_number) === -1)
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
			title : "中央缴费",
			discount_list : [],
			qrcode_discount_list : [],
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
			cancelQrcodeDiscount : function(i){
				avalon.vmodels.$paywin.qrcode_discount_list.removeAt(i);
			},
			buttons : [{
				text : "优惠扫码",
				theme : "primary",
				handler : function(vmodel){
					/*vmodel.qrcode_discount_list.push({
						discount_validate_value : "30",
						discount_no : "ssss",
						discount_name : "fefeff",
						discount_amount : '0',
						discount_time_min : '30',
					});*/
					avalon.vmodels.$qrcode.open();
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
					var discount_no = [];
					for(var i=0,ii;ii=vmodel.qrcode_discount_list[i++];){
						discount_no.push(ii.discount_no);
					}
					var now = avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss");
					Index.websocket.send({
						command : "SYNCHRONIZATION_PREPAYMENT",
						biz_content : {
							prepayment_list : [{
								car_license_number : vmodel.car_license_number,
								enter_car_card_number : "",
								enter_time : Index.getEmptyStr(vmodel.enter_time),
								discount_validate_value : "",
								discount_no : discount_no.join("+"),
								discount_name : discount_name.join("+"),
								discount_amount : '0',
								discount_time_min : totalTime + '',
								prepayment_total_amount : vmodel.$total_amountActual,
								actual_receivable : vmodel.$supplementary,
								received_amount : vmodel.$supplementary,
								payment_mode : "0",
								pay_origin : "center",
								last_prepayment_time : now,
								operator : Index.top.accountName,
								status : '1',
								report_status : "1",
								report_time : now
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
				if(isInit){
					vmodel.qrcode_discount_list.$watch("length",function(){
						getCharge(vmodel);
					});
				}
				for(var i=0,ii;ii=vmodel.discount_list[i++];){
					ii._count = 1;
					ii._checked = false;
				}
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
			correctNum : "",
			correctNumBlur : function(){
				var $win = avalon.vmodels.$correctWin;
				$win.correctNum = $win.correctNum.toUpperCase();
			}
		},
		//二维码扫描窗口
		$qrcodeOpts : {
			title : "优惠扫码",
			result : "",
			error : "",
			videoError : "",
			isCatching : false,
			qrCodeHtml : "",
			$scanner : null,
			buttons : [{
				text : "{{isCatching ? '暂停' : '继续'}}",
				theme : "primary",
				handler : function(vmodel){
					vmodel.isCatching = !vmodel.isCatching;
				}
			}],
			afterShow : function(isInit,vmodel){
				if(isInit){
					window.QRCODE_SCAN_CALLBACK = function(flag,result){
						if(flag === 1){
							Index.websocket.send({
								command : "GET_CODE_MESSAGE",
								biz_content : {
									qrcode : result,
									operator : Index.top.accountName,
									opera_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
								}
							},document.body,function(data){
								if(data.code === '0' && data.msg === "ok"){
									vmodel.close();
									avalon.vmodels.$paywin.qrcode_discount_list.push(data);
								}else{
									//解释失败
									setTimeout(function(){
										document.querySelector("#qrCodeIframe").contentWindow.continueScan();
									},1000);
								}
							});
						}else if(flag === -1){
							vmodel.videoError = "抱歉，您的浏览器不支持该功能";
						}else if(flag === 0){
							vmodel.result = '扫描中,请稍候...';
						}
					};
					vmodel.$watch("isCatching",function(newVal){
						if(newVal){
							vmodel.qrCodeHtml = '<iframe id="qrCodeIframe" width="100%" height="100%" frameborder="0" scrolling="no" src="charge.qrcode.html?'+(+new Date)+'"></iframe>';
						}else{
							vmodel.qrCodeHtml = '';
							vmodel.result = '';
						}
					});
				}
				vmodel.isCatching = true;
			},
			onClose : function(vmodel){
				vmodel.isCatching = false;
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
		if(data.code === '0' && data.msg === "ok"){
			content.parkingName = data.parking_lot_list[0].parking_lot_name;
			Index.init(function(){
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
			},document.body,data);
		}
	});
	function load(func,area,page){
		Index.websocket.send({
			command : "GET_REAL_TIME_CAR"
		},area,function(data){
			if(data.code === "0" && data.msg === "ok"){
				REAL_TIME_CAR_LIST = data.real_time_list;
				REAL_TIME_CAR_LIST.sort(function(a,b){
					return Index.getDateSortResult(a,b,'enter_time');
				});
				avalon.vmodels.$carList.loadFrontPageData(REAL_TIME_CAR_LIST,page || 1);
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
		//固定优惠
		for(var i=0,ii;ii=discount_list[i++];){
			if(ii._checked){
				totalTime += (+ii.discount_time_min * ii._count);
			}
		}
		//扫码优惠
		for(var i=0,ii;ii=$paywin.qrcode_discount_list[i++];){
			totalTime += (+ii.discount_time_min);
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
				load(null,document.body,avalon.vmodels.$carList.curPage);
			}else{
				Index.alert("校正失败，请重试。");
			}
		});
	}
});