require(["common/table/avalon.table"],function(){
	var testData = [];
	for(var i=0;i<58;i++){
		testData.push({
			id : i + '',
			name : parseInt(Math.random() * 100) + ''
		});
	}
	avalon.log(testData);
	var vmodel = avalon.define({
		$id : "page",
		sDate : null,
		eDate : null,
		$userListOpts : {
			columns : [{
				title : "ID",field : "id"
			},{
				title : "昵称",field : "name"
			},{
				title : "邮箱",field : "email"
			},{
				title : "手机号码",field : "phonenum"
			},{
				title : "性别",field : "sex"
			},{
				title : "年龄",field : "age"
			},{
				title : "账号状态",field : "accountState"
			},{
				title : "在线状态",field : "onlineState"
			},{
				title : "操作",field : "oper",formatter : function(v,r){
					return "<a href='javascript:void(0)' ms-click='$detail(item)'>详情</a> "+
					"<a href='javascript:void(0)' ms-click='$log(item)'>日志</a> "+
					"<a href='javascript:void(0)' ms-click='$del(item)'>删除</a>";
				}
			}],
			title : "用户列表",
			frontPageData : testData,
			$detail : function(item){

			},
			$log : function(item){

			},
			$del : function(item){

			}
		}
	});
	avalon.scan();
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
});