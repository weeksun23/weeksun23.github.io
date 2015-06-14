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
				{title : "姓名",field : "customer_name"},
				{title : "类型",field : "customer_type"},
				{title : "车牌号码",field : "car_license_number"},
				{title : "有效期",field : "date",
					formatter : function(v,r){
						return r.vip_begin_time + "~" + r.vip_end_time;
					}
				},
				{title : "安保",field : "is_open_safe_mode"},
				{title : "操作",field : "oper",
					formatter : function(){
						return "<a href='javascript:void(0)'>编辑</a> <a href='javascript:void(0)'>删除</a>"
					}
				}
			],
			frontPageData : []
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
	function getList(){
		Index.websocket.send({
			command : "GET_CUSTOMER_INFOR"
		},document.body,function(data){
			var vip_customer_list = data.vip_customer_list;
			var vip_car_lsit = data.vip_car_lsit;
			for(var i=0,ii;ii=vip_customer_list[i++];){
				for(var j=0,jj;jj=vip_car_lsit[j++];){
					if(ii.customer_seq === jj.vip_customer_seq){
						avalon.mix(ii,jj);
					}
				}
			}
			avalon.vmodels.$userTb.loadFrontPageData(vip_customer_list);
		});
	}
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body,function(data){
		Index.init();
		if(data.code === '0' && data.msg === "ok"){
			content.parkingName = data.parking_lot_list[0].parking_lot_name;
			getList();
		}
	});
});