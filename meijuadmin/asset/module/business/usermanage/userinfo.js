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
require(["lib/datetimepicker/bootstrap-datetimepicker-module","common/table/avalon.table"],function($){
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
		showDetail : false,
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
			frontPageData : getTestData(),
			$detail : function(item){
				vmodel.showDetail = true;

			},
			$log : function(item){

			},
			$del : function(item){

			}
		},
		$closeDetail : function(){
			vmodel.showDetail = false;
		},
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
					return "<a href='javascript:void(0)' ms-click='$edit(item)'>修改</a> "+
					"<a href='javascript:void(0)' ms-click='$del(item)'>删除</a>";
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
		accountState : 'unactive',
		$toggleChoose : function(type,val){
			vmodel[type] = val;
		}
	});
	avalon.bindingHandlers.parentwin["userInfo-editHomeInfo"] = {
		obj : {
			isDefault : '1',
			homeId : '2344',
			number : '3455',
			name : 'r23r3rr',
			otherName : "3r23r23r",
			role : '0'
		},
		title : '修改家庭',
		buttons : [{
			text : '确定',theme : 'primary',handler : function(vmodel){
				
			}
		},{
			text : '关闭',close : true
		}]
	};
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