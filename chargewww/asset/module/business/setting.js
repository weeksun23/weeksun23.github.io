require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
require([
	"common/index",
	"common/table/avalon.table"
],function(Index){
	Index.top.curIndex = 3;
	var content = avalon.define({
		$id : "content",
		$userTbOpts : {
			title : "VIP用户列表",
			columns : [
				{title : "姓名",field : "name"},
				{title : "类型",field : "type"},
				{title : "车牌号码",field : "carnum"},
				{title : "有效期",field : "date"},
				{title : "安保",field : "ser"},
				{title : "操作",field : "oper",
					formatter : function(){
						return "<a href='javascript:void(0)'>编辑</a> <a href='javascript:void(0)'>删除</a>"
					}
				}
			],
			frontPageData : [
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'}
			]
		},
		parkingName : '--',
		add : function(){
			avalon.vmodels.$userWin.open();
		}
	});
	var body = avalon.define({
		$id : "body",
		$userWinOpts : {
			title : "用户信息窗口",
			buttons : [{
				text : "确定",
				theme : "primary",
				handler : function(vmodel){

				}
			},{
				text : "取消",
				theme : "default",
				close : true
			}]
		}
	});
	avalon.scan();
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body,function(data){
		Index.init();
		if(data.code === '0' && data.msg === "ok"){
			content.parkingName = data.parking_lot_list[0].parking_lot_name;
		}
	});
});