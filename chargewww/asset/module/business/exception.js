require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tab/avalon.tab"
],function(Index){
	Index.top.curIndex = 4;
	var content = avalon.define({
		$id : "content",
		$tabOpts : {

		},
		//correct 矫正
		correct : {
			sDateStr : "",
			eDateStr : "",
			sOperDateStr : "",
			eOperDateStr : "",
			car_license_number : "",
			enter_car_license_number : "",
			in_operate_name : ""
		},
		$correctListOpts : {
			title : "异常信息列表",
			columns : [
				{field : "car_license_number",title : '最终车牌'},
				{field : "enter_car_license_number",title : '识别车牌'},
				{field : "enter_car_license_picture",title : '车牌照'},
				{field : "enter_time",title : '入场时间'},
				{field : "enter_car_type",title : 'VIP类型',formatter : Index.mData.getVipType},
				{field : "in_operate_name",title : '操作人'},
				{field : "in_operate_time",title : '操作时间'}
			]
		},
		correctSearch : function(){

		},
		//match
		match : {
			sDateStr : "",
			eDateStr : "",
			sOutDateStr : "",
			eOutDateStr : "",
			car_license_number : "",
			channel : "",
			cartype : "",
			oper : ""
		},
		$matchListOpts : {
			title : "异常信息列表",
			columns : [
				{field : "car_license_number",title : '最终车牌'},
				{field : "enter_car_license_number",title : '识别车牌'},
				{field : "enter_car_license_picture",title : '车牌照'},
				{field : "enter_time",title : '入场时间'},
				{field : "enter_car_type",title : 'VIP类型',formatter : Index.mData.getVipType},
				{field : "in_operate_name",title : '操作人'},
				{field : "in_operate_time",title : '操作时间'}
			]
		},
		matchSearch : function(){

		}
		//
	});
	avalon.scan();
	var adjust_list;
	Index.websocket.send({
		command : "GET_ABNORMAL",
		biz_content : {
			abnormal_lever : "0"
		}
	},document.body,function(data){
		Index.init();
		adjust_list = data.adjust_list;
		$("div.date").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
	});
});