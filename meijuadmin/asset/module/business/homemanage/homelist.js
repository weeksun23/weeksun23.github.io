require(["common/table/avalon.table"],function(){
	function getTestData(){
		var testData = [];
		for(var i=0;i<58;i++){
			testData.push({
				id : i + '',
				name : parseInt(Math.random() * 100) + ''
			});
		}
		return testData;
	}
	var vmodel = avalon.define({
		$id : "page",
		sDate : null,
		eDate : null,
		$homeListOpts : {
			columns : [{
				title : "序号",field : "number"
			},{
				title : "家庭ID",field : "homeId"
			},{
				title : "家庭号",field : "homeNumber"
			},{
				title : "家庭名称",field : "name"
			},{
				title : "家庭昵称",field : "homeOtherName"
			},{
				title : "角色",field : "role"
			},{
				title : "默认家庭",field : "isDefaultHome"
			},{
				title : "操作",field : "oper",formatter : function(v,r){
					return "<a href='javascript:void(0)' ms-click='$del(item)'>删除</a>";
				}
			}],
			title : "家庭列表",
			frontPageData : getTestData(),
			$del : function(item){

			},
			$edit : function(){
				parent.avalon.showDialog("userInfo-editHomeInfo");
			}
		},
		detailSex : 'man',
		accountState : 'unactive'
	});
	avalon.scan();
	(function(){
		function getOpts(){
			return {
				language:  'zh-CN',
		        format : "yyyy-mm-dd hh:ii",
		        weekStart: 1,
		        todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2
			};
		}
		$('#sDatePicker').datetimepicker(getOpts()).on("changeDate",function(ev){
			vmodel.sDate = ev.date ? ev.date.getTime() : null;
		});
		$('#eDatePicker').datetimepicker(getOpts()).on("changeDate",function(ev){
			vmodel.eDate = ev.date ? ev.date.getTime() : null;
		});
	})();
});