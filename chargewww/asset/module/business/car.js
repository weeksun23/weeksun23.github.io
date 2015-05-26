require([
	"common/index",
	"common/table/avalon.table",
	"common/tooltip/avalon.tooltip",
	"common/dialog/avalon.dialog",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 1;
	var content = avalon.define({
		$id : "content",
		$carListOpts : {
			title : "车辆列表",
			columns : [
				{title : "序号",field : "n"},
				{title : "最终车牌",field : "car_license_number",
					formatter : function(v){
						return "<a href='javascript:void(0)' ms-click='correctCarNum' ms-widget='tooltip' data-tooltip-content='纠正车牌'>" +
							v + "</a>";
					}
				},
				{title : "入场识别车牌",field : "enter_car_license_number"},
				{title : "车牌图片",field : "enter_car_license_picture"},
				{title : "入场时间",field : "enter_time"},
				{title : "入场通道",field : "enter_channel"},
				{title : "车辆类型",field : "enter_vip_type"},
				{title : "放行模式",field : "pass_type"},
				{title : "置信度",field : "enter_recognition_confidence"},
				{title : "值班人员",field : "in_operate_name"}
			],
			frontPageData : [
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"}
			],
			correctCarNum : function(){
				avalon.vmodels.$correctWin.open();
			}
		},
		$correctWinOpts : {
			title : "纠正车牌",
			buttons : [{
				text : "确定",theme : "success"
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
			}
		}
	});
	avalon.scan();
	$("#inTimePicker").datetimepicker({
		language:  'zh-CN',
	    format : "yyyy-mm-dd hh:ii:ss",
	    weekStart: 1,
	    todayBtn:  1,
		autoclose: 1,
		todayHighlight: 1,
		startView: 2
	});
});