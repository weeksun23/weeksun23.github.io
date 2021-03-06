require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	},
	urlArgs : "v=" + (+new Date)
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tab/avalon.tab"
],function(Index){
	Index.top.curIndex = 4;
	var list_data = {};
	function getKeyByLever(abnormal_lever){
		switch(abnormal_lever){
			case "0":return "adjust_list";
			case "1":return "match_list";
			case "2":return "abnormal_enter_car_list";
			case "3":return "unmatch_leave_car_list";
			case "4":return "uncharge_car_list";
			case "5":return "human_record_list";
		}
	}
	function getLeverByListId(listId){
		switch(listId){
			case "$correctList":return "0";
			case "$matchList":return "1";
			case "$intoList":return "2";
			case "$outList":return "3";
			case "$unpayList":return "4";
			case "$retypeList":return "5";
		}
	}
	function getChannelData(list,key){
		var channelObj = {};
		for(var i=0,ii;ii=list[i++];){
			channelObj[ii[key]] = 1;
		}
		var arr = [];
		for(var i in channelObj){
			avalon.each(getChannelData.entrance_channel_list,function(j,item){
				if(item.entrance_channel_seq === i){
					arr.push({
						text : item.entrance_name,
						value : i
					});
				}
			});
		}
		return arr;
	}
	function getVipType(list,key){
		var obj = {};
		for(var i=0,ii;ii=list[i++];){
			obj[ii[key]] = 1;
		}
		var arr = [];
		for(var i in obj){
			arr.push({
				text : Index.mData.getVipType(i),
				value : i
			});
		}
		return arr;
	}
	var hasInit = false;
	function getData(listId){
		var lever = getLeverByListId(listId);
		Index.websocket.send({
			command : "GET_ABNORMAL",
			biz_content : {
				abnormal_lever : lever
			}
		},document.body,function(data){
			if(data.code === '0'){
				var list = data[getKeyByLever(lever)];
				list_data[listId] = list;
				if(!hasInit){
					//初始化
					hasInit = true;
					//基本信息指令
					Index.websocket.send({
						command : "GET_PARKING_LOT_BASE_DATE",
						biz_content : {
							request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
						}
					},document.body,function(data){
						getChannelData.entrance_channel_list = data.entrance_channel_list;
						avalon.vmodels.$correctCarNum.$parking_lot_seq = data.parking_lot_list[0].parking_lot_seq;
						$("div.date").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
					});
				}
				avalon.vmodels[listId].loadFrontPageData(list);
				if(listId === "$correctList"){
					content.correct_operators = Index.getUnsameVal(list,"in_operate_name");
				}else if(listId === "$matchList"){
					content.match_channelData = getChannelData(list,"leave_channel");
					content.match_cay_type = getVipType(list,"leave_vip_type");
					content.match_operators = Index.getUnsameVal(list,"out_operate_name");
				}else if(listId === '$intoList'){
					content.into_vip_type = getVipType(list,"enter_vip_type");
				}else if(listId === '$outList'){
					content.out_channelData = getChannelData(list,"leave_channel");
					content.out_vip_type = getVipType(list,'leave_vip_type');
					content.out_operators = Index.getUnsameVal(list,"out_operate_name");
				}else if(listId === "$unpayList"){
					//content.unpay_channelData = getChannelData(list,"leave_channel");
					//content.unpay_vip_type = getVipType(list,"leave_channel");
					content.unpay_operators =  Index.getUnsameVal(list,"operator");
				}else if(listId === "$retypeList"){
					content.retype_vips = getVipType(list,"enter_type");
					content.retype_channelData = getChannelData(list,"enter_channel");
					content.retype_operators = Index.getUnsameVal(list,"in_operate_name");
				}
			}
		});
	}
	var idArr = ['$correctList','$matchList','$intoList','$outList','$unpayList','$retypeList'];
	var headerData = (function(){
		var re = [];
		for(var i=0;i<6;i++){
			re.push({
				icons : [{
					iconCls : 'glyphicon-refresh',
					handler : function(i){
						var tab = avalon.vmodels.$tab;
						if(!tab.contentData[i].$init) return;
						getData(idArr[i]);
					}
				}]
			});
		}
		return re;
	})();
	var formatter = {
		img : function(v){
			return "<img onerror='Index.onImgError(this)' src='" +
				Index.dealPicSrc(v) +
				"' height='30' alt='车牌图片'>";
		}
	};
	var content = avalon.define({
		$id : "content",
		$tabOpts : {
			headerData : headerData,
			onSelect : function(h,c,i){
				if(!c.$init){
					if(i === 0){
						Index.init(function(){
							getData(idArr[i]);
						},document.body);
					}else{
						getData(idArr[i]);
					}
				}
			}
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
		correct_operators : [],
		$correctListOpts : {
			title : "异常信息列表",
			columns : [
				{field : "car_license_number",title : '最终车牌'},
				{field : "enter_car_license_number",title : '识别车牌'},
				{field : "enter_car_license_picture",title : '车牌照',
					formatter : formatter.img
				},
				{field : "enter_time",title : '入场时间'},
				{field : "enter_vip_type",title : 'VIP类型',formatter : Index.mData.getVipType},
				{field : "in_operate_name",title : '操作人'},
				{field : "in_operate_time",title : '操作时间'}
			]
		},
		correctSearch : function(){
			var list = list_data.$correctList;
			var model = content.correct;
			var re = [];
			for(var i=0,ii=list.length;i<ii;i++){
				var item = list[i];
				if((model.car_license_number && item.car_license_number.indexOf(model.car_license_number) === -1) 
					|| (model.enter_car_license_number && item.enter_car_license_number.indexOf(model.enter_car_license_number) === -1) 
					|| (model.sDateStr && item.enter_time < model.sDateStr) 
					|| (model.eDateStr && item.enter_time > model.eDateStr)
					|| (model.sOperDateStr && item.in_operate_time < model.sOperDateStr) 
					|| (model.eOperDateStr && item.in_operate_time > model.eOperDateStr) 
					|| (model.in_operate_name && item.in_operate_name !== model.in_operate_name)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$correctList.loadFrontPageData(re);
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
		match_channelData : [],
		match_cay_type : [],
		$matchListOpts : {
			title : "异常信息列表",
			columns : [
				{field : "enter_car_license_number",title : '入场车牌'},
				{field : "enter_car_license_picture",title : '车牌照',formatter : formatter.img},
				{field : "enter_time",title : '入场时间'},
				{field : "leave_car_license_number",title : '出场车牌'},
				{field : "leave_car_license_picture",title : '车牌照',formatter : formatter.img},
				{field : "leave_time",title : '出场时间'},
				{field : "leave_vip_type",title : 'VIP类型',formatter : Index.mData.getVipType},
				{field : "out_operate_name",title : '操作人'},
				{field : "out_operate_time",title : '操作时间'}
			]
		},
		match_operators : [],
		matchSearch : function(){
			var list = list_data.$matchList;
			var model = content.match;
			var re = [];
			for(var i=0,ii=list.length;i<ii;i++){
				var item = list[i];
				if((model.car_license_number && item.enter_car_license_number.indexOf(model.car_license_number) === -1) 
					|| (model.sDateStr && item.enter_time < model.sDateStr) 
					|| (model.eDateStr && item.enter_time > model.eDateStr)
					|| (model.sOutDateStr && item.leave_time < model.sOutDateStr) 
					|| (model.eOutDateStr && item.leave_time > model.eOutDateStr) 
					|| (model.channel && item.leave_channel === model.channel)
					|| (model.cartype && item.leave_type === model.cartype)
					|| (model.oper && item.out_operate_name !== model.oper)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$matchList.loadFrontPageData(re);
		},
		//into
		into : {
			sDateStr : "",
			eDateStr : "",
			car_license_number : "",
			vip_type : ""
		},
		$intoListOpts : {
			title : "异常信息列表",
			columns : [
				{field : "car_license_number",title : '最终车牌'},
				{field : "enter_car_license_number",title : '识别车牌'},
				{field : "enter_car_license_picture",title : '车牌照',formatter : formatter.img},
				{field : "enter_time",title : '入场时间'},
				{field : "enter_vip_type",title : 'VIP类型',formatter : Index.mData.getVipType},
				{field : "in_operate_name",title : '操作人'},
				{field : "in_operate_time",title : '操作时间'}
			]
		},
		into_vip_type : [],
		intoSearch : function(){
			var list = list_data.$intoList;
			var model = content.into;
			var re = [];
			for(var i=0,ii=list.length;i<ii;i++){
				var item = list[i];
				if((model.car_license_number && item.enter_car_license_number.indexOf(model.car_license_number) === -1) 
					|| (model.sDateStr && item.enter_time < model.sDateStr) 
					|| (model.eDateStr && item.enter_time > model.eDateStr)
					|| (model.vip_type && item.enter_vip_type !== model.vip_type)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$intoList.loadFrontPageData(re);
		},
		//out
		out : {
			sDateStr : "",
			eDateStr : "",
			sInDateStr : "",
			eInDateStr : "",
			car_license_number : "",
			channel : "",
			vip_type : "",
			oper : ""
		},
		out_channelData : [],
		out_vip_type : [],
		out_operators : [],
		outSearch : function(){
			var list = list_data.$outList;
			var model = content.out;
			var re = [];
			for(var i=0,ii=list.length;i<ii;i++){
				var item = list[i];
				if((model.car_license_number && item.leave_car_license_number.indexOf(model.car_license_number) === -1) 
					|| (model.sDateStr && item.enter_time < model.sDateStr) 
					|| (model.eDateStr && item.enter_time > model.eDateStr)
					|| (model.sInDateStr && item.leave_time < model.sInDateStr) 
					|| (model.eInDateStr && item.leave_time > model.eInDateStr)
					|| (model.channel && item.leave_channel !== model.channel)
					|| (model.vip_type && item.leave_vip_type !== model.vip_type)
					|| (model.oper && item.out_operate_name !== model.oper)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$outList.loadFrontPageData(re);
		},
		$outListOpts : {
			title : "异常信息列表",
			columns : [
				{field : "a1",title : '入场车牌',formatter : function(){return '--'}},
				{field : "a2",title : '车牌照',formatter : function(){return '--'}},
				{field : "a3",title : '入场时间',formatter : function(){return '--'}},
				{field : "leave_car_license_number",title : '出场车牌'},
				{field : "leave_car_license_picture",title : '车牌照',formatter : formatter.img},
				{field : "leave_time",title : '出场时间'},
				{field : "leave_vip_type",title : 'VIP类型',formatter : Index.mData.getVipType},
				{field : "out_operate_name",title : '操作人'},
				{field : "out_operate_time",title : '操作时间'}
			]
		},
		//unpay
		unpay : {
			sDateStr : "",
			eDateStr : "",
			sInDateStr : "",
			eInDateStr : "",
			car_license_number : "",
			channel : "",
			vip_type : "",
			oper : ""
		},
		unpay_channelData : [],
		unpay_vip_type : [],
		unpay_operators : [],
		unpaySearch : function(){
			var list = list_data.$unpayList;
			var model = content.unpay;
			var re = [];
			for(var i=0,ii=list.length;i<ii;i++){
				var item = list[i];
				if((model.car_license_number && item.car_license_number.indexOf(model.car_license_number) === -1) 
					|| (model.sDateStr && item.last_prepayment_time < model.sDateStr) 
					|| (model.eDateStr && item.last_prepayment_time > model.eDateStr)
					|| (model.sInDateStr && item.enter_time < model.sInDateStr) 
					|| (model.eInDateStr && item.enter_time > model.eInDateStr)
					//|| (model.channel && item.leave_channel !== model.channel)
					//|| (model.vip_type && item.leave_vip_type !== model.vip_type)
					|| (model.oper && item.operator !== model.oper)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$unpayList.loadFrontPageData(re);
		},
		$unpayListOpts : {
			title : "异常信息列表",
			columns : [
				{title : "入场车牌号",field : "car_license_number"},
				{title : "入场时间",field : "enter_time"},
				{title : "离场时间",field : "last_prepayment_time",
					formatter : function(v,r){
						if(r.pay_origin === 'web' || r.pay_origin === 'system'){
							return v;
						}
						return "--";
					}
				},
				{title : "停车时间<br>(分钟)",align:'center',field : "stopping_time",formatter : function(v,r){
					if(r.pay_origin === 'web' || r.pay_origin === 'system'){
						var e = new Date(r.last_prepayment_time.replace(/\-/g,'/'));
						var s = new Date(r.enter_time.replace(/\-/g,'/'));
						var ms = e.getTime() - s.getTime();
						var hours = ms / 1000 / 60 / 60;
						var d = parseInt(hours / 24);
						var _h = hours - d * 24;
						var h = parseInt(_h);
						var m = (_h - h) * 60;
						return d + "天" + h + "小时" + parseInt(m) + '分钟';
					}
					return '--';
				}},
				{title : "预付费<br>离场时间",field : "last_prepayment_time",align:'center'},
				{title : "离场<br>优惠",field : "discount_name",align:'center',
					formatter : function(v){
						return v ? v : "--";
					}
				},
				{title : "离场<br>应收",field : "actual_receivable",formatter : Index.getMoney,align:'center'},
				{title : "离场<br>实收",field : "received_amount",
					formatter : Index.getMoney,
					align:'center'
				},
				{title : "收费员",field : "operator"}
			]
		},
		retype : {
			car_license_number : "",
			vip_type : "",
			channel : "",
			oper : ""
		},
		retype_vips : [],
		retype_channelData : [],
		retype_operators : [],
		retypeSearch : function(){
			var list = list_data.$retypeList;
			var model = content.retype;
			var re = [];
			for(var i=0,ii=list.length;i<ii;i++){
				var item = list[i];
				if((model.car_license_number && item.car_license_number.indexOf(model.car_license_number) === -1) 
					|| (model.channel && item.enter_channel !== model.channel)
					|| (model.vip_type && item.enter_vip_type !== model.vip_type)
					|| (model.oper && item.in_operate_name !== model.oper)){
					continue;
				}
				re.push(item);
			}
			avalon.vmodels.$retypeList.loadFrontPageData(re);
		},
		$retypeListOpts : {
			title : "补录列表",
			columns : [
				{title : "最终车牌",field : "car_license_number"},
				{title : "进场时间",field : "enter_time"},
				{title : "进场类型",field : "enter_vip_type",formatter : Index.mData.getVipType},
				{title : '操作人',field : "in_operate_name"}
			]
		}
	});
	avalon.scan();
});