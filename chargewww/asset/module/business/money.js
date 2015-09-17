require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	},
	urlArgs : "v=" + (+new Date)
});
require([
	"common/index",
	"common/table/avalon.table",
	//"common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 2;
	var prepayment_list;
	var content = avalon.define({
		$id : "content",
		$carListOpts : {
			title : "收费记录列表",
			columns : [
				{title : "入场车牌号",field : "car_license_number"},
				{title : "入场时间",field : "enter_time"},
				{title : "离场时间",field : "last_prepayment_time",
					formatter : function(v,r){
						if(r.pay_origin === 'web' || r.pay_origin === 'system'){
							return v;
						}
						return "--";
					}
				},
				{title : "停车时间<br>(分钟)",align:'center',field : "stopping_time",formatter : function(v,r){
					if(r.pay_origin === 'web' || r.pay_origin === 'system'){
						var e = new Date(r.last_prepayment_time.replace(/\-/g,'/'));
						var s = new Date(r.enter_time.replace(/\-/g,'/'));
						var ms = e.getTime() - s.getTime();
						var hours = ms / 1000 / 60 / 60;
						var d = parseInt(hours / 24);
						var _h = hours - d * 24;
						var h = parseInt(_h);
						var m = (_h - h) * 60;
						return d + "天" + h + "小时" + parseInt(m) + '分钟';
					}
					return '--';
				}},
				{title : "预付费<br>离场时间",field : "last_prepayment_time",align:'center'},
				{title : "离场<br>优惠",field : "discount_name",align:'center',
					formatter : function(v){
						return v ? v : "--";
					}
				},
				{title : "离场<br>应收",field : "actual_receivable",formatter : Index.getMoney,align:'center'},
				{title : "离场<br>实收",field : "received_amount",
					formatter : function(v,r){
						if(+v < +r.actual_receivable){
							return Index.getMoney(v) + "<br><a class='text-danger' ms-click='repay(item)' href='javascript:void(0)'>补交</a>";
						}
						return Index.getMoney(v);
					},
					align:'center'
				},
				{title : "收费员",field : "operator"}
			],
			repay : function(item){
				var win = avalon.vmodels.$repayWin;
				win.$item = item;
				win.open();
			}
		},
		inCarNum : "",
		sMoney : "",
		eMoney : "",
		inSdate : "",
		inEdate : "",
		outSdate : "",
		outEdate : "",
		operator : '',
		operators : [],
		search : function(){
			var re = [];
			for(var i=0,ii=prepayment_list.length;i<ii;i++){
				var item = prepayment_list[i];
				if((content.inCarNum && item.car_license_number.indexOf(content.inCarNum) === -1) 
					|| (content.sMoney && +item.received_amount < +content.sMoney) 
					|| (content.eMoney && +item.received_amount > +content.eMoney) 
					|| (content.inSdate && item.enter_time < content.inSdate) 
					|| (content.inEdate && item.enter_time > content.inEdate) 
					|| (content.outSdate && item.last_prepayment_time < content.outSdate) 
					|| (content.outEdate && item.last_prepayment_time > content.outEdate)
					|| (content.operator && item.operator !== content.operator)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$carList.loadFrontPageData(re);
		},
		rePaySearch : function(){
			var re = [];
			for(var i=0,ii=prepayment_list.length;i<ii;i++){
				var item = prepayment_list[i];
				if(item.actual_receivable === item.received_amount){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$carList.loadFrontPageData(re);
		},
		$repayWinOpts : {
			title : "补交金额",
			buttons : [{
				text : "补交",
				theme : "danger",
				handler : function(vmodel){
					var model = vmodel.model;
					//下发收费接口P6.9 
					var discount_time_min = "";
					for(var i=0,ii=vmodel.discountList.length;i<ii;i++){
						var item = vmodel.discountList[i];
						if(item.discount_name === model.discount_name){
							discount_time_min = item.discount_time_min;
							break;
						}
					}
					Index.websocket.send({
						command : "SYNCHRONIZATION_PREPAYMENT",
						biz_content : {
							prepayment_list : [{
								car_license_number : model.car_license_number,
								enter_car_card_number : "",
								enter_time : model.enter_time,
								discount_name : model.discount_name,
								discount_amount : "",
								discount_time_min : discount_time_min,
								prepayment_total_amount : model.prepayment_total_amount,
								actual_receivable : model.actual_receivable,
								received_amount : model.actual_receivable,
								payment_mode : "0",
								pay_origin : "web",
								last_prepayment_time : vmodel.$item.last_prepayment_time,
								operator : Index.top.accountName
							}]
						}
					},vmodel.widgetElement,function(data){
						if(data.code === '0' && data.msg === "ok"){
							Index.alert("补交成功");
							vmodel.close();
							loadData();
						}else{
							Index.alert("补交失败");
						}
					});
				}
			},{
				text : '取消',
				close : true
			}],
			discountList : [{discount_seq : "",discount_name : "无优惠",discount_time_min : "0"}],
			model : {
				car_license_number : '--',
				enter_time : "--",
				last_prepayment_time : '--',
				discount_name : '无优惠',
				actual_receivable : '--',
				actual_receivable_formatter : '--',
				prepayment_total_amount : '',
			},
			$item : null,
			afterShow : function(isInit,vmodel){
				if(isInit){
					//获取优惠信息
					Index.websocket.send({
						command : "GET_DISCOUNT"
					},vmodel.widgetElement,function(discountData){
						if(discountData.code === "0" && discountData.msg === "ok"){
							var list = discountData.discount_list;
							vmodel.discountList.pushArray(list);
						}
					});
					vmodel.model.$watch("discount_name",function(newVal){
						getCharge(vmodel);
					});
				}
				if(vmodel.$item){
					var m = vmodel.model.$model;
					for(var i in m){
						if(vmodel.$item[i]){
							vmodel.model[i] = vmodel.$item[i];
						}
					}//actual_receivable
					vmodel.model.actual_receivable_formatter = Index.getMoney(vmodel.model.actual_receivable);
				}
			}
		}
	});
	avalon.scan();
	avalon.each(['in','out'],function(i,v){
		$("#" + v + "-sDatePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
		$("#" + v + "-eDatePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
	});
	function loadData(func){
		Index.websocket.send({
			command : "GET_USER_CHARGE_RECORD",
			biz_content : {
				username : Index.top.accountName
			}
		},document.body,function(data){
			if(data.code === '0' && data.msg === "ok"){
				prepayment_list = data.prepayment_list;
				var operators = {};
				for(var i=0,ii;ii=prepayment_list[i++];){
					operators[ii.operator] = 1;
				}
				var arr = [];
				for(var i in operators){
					arr.push(i);
				}
				content.operators = arr;
				prepayment_list.sort(function(a,b){
					return Index.getDateSortResult(a,b,'last_prepayment_time');
				});
				avalon.vmodels.$carList.loadFrontPageData(prepayment_list);
			}
			func && func();
		});
	}
	loadData(function(){
		Index.init();
	});
	function getCharge(vmodel){
		var car_license_number = vmodel.model.car_license_number;
		var enter_time = vmodel.model.enter_time;
		var leave_time = vmodel.model.last_prepayment_time;
		if(vmodel.model.discount_name){
			for(var i=0,ii=vmodel.discountList.length;i<ii;i++){
				var item = vmodel.discountList[i];
				if(item.discount_name === vmodel.model.discount_name){
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
				enter_time : enter_time,
				leave_time : leave_time,
				request_origin : "web"
			}
		},document.body,function(data){
			if(data.code === '0' && data.msg === "ok"){
				vmodel.model.received_amount = data.supplementary;
				vmodel.model.received_amount_formatter = Index.getMoney(data.supplementary);
				vmodel.model.prepayment_total_amount = data.total_amount;
			}
		});
	}
});