require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
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
						if(r.pay_origin === 'web'){
							return v;
						}
						return "--";
					}
				},
				{title : "停车时间(分钟)",field : "stopping_time",formatter : function(v,r){
					if(r.pay_origin === 'web'){
						var e = new Date(r.last_prepayment_time);
						var s = new Date(r.enter_time);
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
				{title : "预付费离场时间",field : "last_prepayment_time"},
				{title : "离场优惠",field : "discount_name",
					formatter : function(v){
						return v ? v : "--";
					}
				},
				{title : "离场应收",field : "received_amount",formatter : Index.getMoney},
				{title : "离场实收",field : "actual_receivable",formatter : Index.getMoney},
				{title : "收费员",field : "operator"}
			]
		},
		inCarNum : "",
		sMoney : "",
		eMoney : "",
		inSdate : "",
		inEdate : "",
		outSdate : "",
		outEdate : "",
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
					|| (content.outEdate && item.last_prepayment_time > content.outEdate)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$carList.loadFrontPageData(re);
		}
	});
	avalon.scan();
	avalon.each(['in','out'],function(i,v){
		$("#" + v + "-sDatePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
		$("#" + v + "-eDatePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
	});
	Index.websocket.send({
		command : "GET_USER_CHARGE_RECORD",
		biz_content : {
			username : localStorage.getItem("curAccount")
		}
	},document.body,function(data){
		if(data.code === '1' && data.msg === "ok"){
			avalon.vmodels.$carList.loadFrontPageData(prepayment_list = data.prepayment_list);
		}
		Index.init();
	});
});