require([
	"common/index","common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 0;
	var content = avalon.define({
		$id : "content",
		showCarlist : function(){
			avalon.vmodels.$carListDialog.open();
		},
		$carListDialogOpts : {
			title : "在场车辆匹配列表",
			list : [{
				src : "image/plate.jpg"
			},{
				src : "image/plate.jpg"
			},{
				src : "image/plate.jpg"
			},{
				src : "image/plate.jpg"
			},{
				src : "image/plate.jpg"
			}],
			showPic : function(){
				avalon.vmodels.$picDialog.open();
			},
			sDate : null,
			eDate : null,
			mes : "结束日期不能少于开始日期",
			afterShow : function(isInit){
				if(isInit){
					Index.initDatePickerToVM($("#sDatePicker"),avalon.vmodels.$carListDialog,"sDate");
					Index.initDatePickerToVM($("#eDatePicker"),avalon.vmodels.$carListDialog,"eDate");
				}
			}
		},
		$picDialogOpts : {
			title : "查看大图",
			content : "<img src='image/full.jpg' alt='车辆大图' class='img-responsive img-rounded'/>"
		}
	});
	avalon.scan();
});