require.config({
    baseUrl: "../../module/",
    paths: {
    	avalon : "avalon",
        text: "../combo/text",
        css: "../combo/css",
        domReady: "../combo/domReady",
        jquery : "lib/jquery/jquery-1.11.3"
    }
});
require(["lib/datetimepicker/bootstrap-datetimepicker-module","common/table/avalon.table","common/form/avalon.form"],function(){
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
		$searchFormOpts : {
			data : [
				[{field : "userId",text : "用户ID",id : "userId"},{field : "homeId",text : "家庭号",id : "homeId"}],
				[
					{field : "name",text : "名称",id : "name"},
					{text : "成员总数",type : "dom",domId : "tpl1"}
				],
				[
					{text : "家电总数",type : "dom",domId : "tpl2"},
					{field : "createId",text : "创建者ID",id : "createId"}
				],
				[
					{field : "sDate",text : "起始日期",id : "sDate",type : "date",datePickerId : "sDatePicker"},
					{field : "eDate",text : "结束日期",id : "eDate",type : "date",datePickerId : "eDatePicker",valid : {
						condition : "model.eDate && model.sDate && (model.eDate < model.sDate)",
						messageField : "eDateMes"
					}}
				]
			],
			model : {
				userId : '',
				homeId : '',
				name : '',
				createId : '',
				sDate : '',
				eDate : '',
				memberNumType : "",
				membernum : '',
				elecnum : ''
			},
			eDateMes : "结束日期不能小于开始日期",
			onInit : function(vmodel){
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
					vmodel.model.sDate = ev.date ? ev.date.getTime() : null;
				});
				$('#eDatePicker').datetimepicker(getOpts()).on("changeDate",function(ev){
					vmodel.model.eDate = ev.date ? ev.date.getTime() : null;
				});
			},
			buttons : [{
				text : "搜索",theme : "primary",handler : function(){
					avalon.log(this.model.$model);
				}
			}]
		}
	});
	/*var searchModel = avalon.define({
		$id : "search",
		memberNumType : '',
		membernum : 1,
		sDate : null,
		eDate : null,
		$dealMembernum : function(f){
			if(searchModel.memberNumType === '') return;
			if(searchModel.membernum + f >= 1)
				searchModel.membernum += f;
		},
		elecNumType : '',
		elecnum : 1,
		$dealElecnum : function(f){
			if(searchModel.elecNumType === '') return;
			if(searchModel.elecnum + f >= 1)
				searchModel.elecnum += f;
		}
	});*/
	avalon.scan();
});