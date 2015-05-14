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
require(["lib/datetimepicker/bootstrap-datetimepicker-module","common/table/avalon.table","common/form/avalon.form"],function($){
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
	var page = avalon.define({
		$id : "page",
		showDetail : false
	});
	var main = avalon.define({
		$id : "main",
		sDate : null,
		eDate : null,
		$searchFormOpts : {
			data : [
				[{field : "userId",text : "用户ID",id : "userId"},{field : "email",text : "邮箱",id : "email"}],
				[
					{field : "phoneNumber",text : "手机号码",id : "phoneNumber",
						valid : {
							condition : "phoneNumberValidFlag",
							messageField : "phoneNumberValidMes"
						}
					},
					{	
						field : "onlineState",text : "在线状态",id : "onlineState",type : "text",
						selectOptions : [{value : "",text : "不限"},{value : "1",text : "在线"},{value : "0",text : "离线"}]
					}
				],
				[
					{field : "sDate",text : "起始日期",id : "sDate",type : "date",datePickerId : "sDatePicker"},
					{field : "eDate",text : "结束日期",id : "eDate",type : "date",datePickerId : "eDatePicker",valid : {
						condition : "model.eDate && model.sDate && (model.eDate < model.sDate)",
						messageField : "eDateMes"
					}}
				],
				[
					{field : "accountState",text : "账号状态",id : "accountState",type : "select",selectOptions : [
						{value : "",text : "不限"},{value : "0",text : "未激活"},
						{value : "1",text : "已激活"},{value : "2",text : "禁用"}
					]}
				]
			],
			phoneNumberValidFlag : false,
			phoneNumberValidMes : "请输入正确的手机号码",
			model : {
				userId : "",
				email : "",
				phoneNumber : "",
				onlineState : "",
				sDate : null,
				eDate : null,
				accountState : ""
			},
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
				vmodel.model.$watch("phoneNumber",function(newVal){
					vmodel.phoneNumberValidFlag = !/^\d*$/.test(newVal);
				});
			},
			eDateMes : "结束日期不能少于开始日期",
			buttons : [{
				text : "搜索",theme : "primary",handler : function(){
					avalon.log(this.model.$model);
				}
			}]
		},
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
				page.showDetail = true;
			},
			$log : function(item){

			},
			$del : function(item){

			}
		}
	});
	var detail = avalon.define({
		$id : "detail",
		$closeDetail : function(){
			page.showDetail = false;
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
			detail[type] = val;
		},
		$detailFormOpts : {
			data : [
				[{field : "userId",text : "用户ID",id : "detail-userId"},{field : "name",text : "昵称",id : "detail-name"}],
				[
					{field : "email",text : "邮箱",id : "detail-email"},
					{field : "phoneNumber",text : "手机号码",id : "detail-phoneNumber",
						valid : {
							condition : "phoneNumberValidFlag",
							messageField : "phoneNumberValidMes"
						}
					}
				],
				[
					{text : "性别",type : "dom",domId : "tpl1"},
					{field : "age",text : "年龄",id : "detail-age",type : "spinner",readonly : true,min : 1,max : 200}
				],
				[
					{field : "addr",text : "地址",id : "detail-addr"},
					{field : "homePhone",text : "固定电话",id : "detail-homephone"}
				],
				[
					{field : "registerDate",text : "注册时间"},
					{text : "账号状态",type : "dom",domId : "tpl2"}
				]
			],
			phoneNumberValidFlag : false,
			phoneNumberValidMes : "请输入正确的手机号码",
			onInit : function(vmodel){
				vmodel.model.$watch("phoneNumber",function(newVal){
					vmodel.phoneNumberValidFlag = !/^\d*$/.test(newVal);
				});
			},
			model : {
				userId : "",name : "",
				email : "",phoneNumber : "",
				age : 18,addr : "",
				homePhone : "",registerDate : "",
				accountState : "unactive",
				detailSex : "man"
			},
			toggleChoose : function(key,val){
				var model = avalon.vmodels.$detailForm.model;
				model[key] = val;
			}
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
				avalon.log(vmodel.obj);
			}
		},{
			text : '关闭',close : true
		}]
	};
	avalon.scan();
});