require([
	"common/index",
	"common/table/avalon.table",
	//"common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 2;
	var content = avalon.define({
		$id : "content",
		$carListOpts : {
			title : "收费记录列表",
			columns : [
				{title : "入场车牌号",field : "car_license_number"},
				{title : "入场时间",field : "enter_time"},
				{title : "离场时间",field : "leave_time"},
				{title : "停车时间",field : "stopping_time"},
				{title : "预付费离场时间",field : "last_prepayment_time"},
				{title : "离场优惠",field : "discount_name"},
				{title : "离场应收",field : "supplementary_payment"},
				{title : "离场实收",field : "received_supplementary_payment"},
				{title : "收费员",field : "toll_collect_name"}
			],
			frontPageData : [
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"},
				{enter_time : "234534",car_license_number : "粤XHN161"}
			]
		}
	});
	avalon.scan();
	avalon.each(['in','out'],function(i,v){
		$("#" + v + "-sDatePicker").datetimepicker(Index.getDateTimePickerOpts());
		$("#" + v + "-eDatePicker").datetimepicker(Index.getDateTimePickerOpts());
	});
});