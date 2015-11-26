require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	},
	urlArgs : "v=" + (+new Date)
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 5;
	var content = avalon.define({
		$id : "content",
		search : function(){
			if(car_out_list){
				var model = content.model.$model;
				var result = [];
				for(var i=0,item;item=car_out_list[i++];){
					if(
						(model.car_license_number && item.car_license_number.indexOf(model.car_license_number) === -1) ||
						(model.sInDateStr && (!item.enter_time || item.enter_time < model.sInDateStr)) ||
						(model.eInDateStr && (!item.enter_time || item.enter_time > model.eInDateStr)) ||
						(model.sOutDateStr && (!item.leave_time || item.leave_time < model.sOutDateStr)) ||
						(model.eOutDateStr && (!item.leave_time || item.leave_time > model.eOutDateStr)) ||
						(model.vip_type && model.vip_type !== item.vip_type) ||
						(model.in_operate_name && model.in_operate_name !== '空' && item.enter_operator !== model.in_operate_name) ||
						(model.in_operate_name === '空' && item.enter_operator !== null && item.enter_operator !== undefined) ||
						(model.out_operate_name && model.out_operate_name !== '空' && item.leave_operator !== model.out_operate_name) ||
						(model.out_operate_name === '空' && item.leave_operator !== null && item.leave_operator !== undefined)
					){
						continue;
					}
					result.push(item);
				}
				avalon.vmodels.$carList.loadFrontPageData(result);
			}
		},
		$carListOpts : {
			title : "车辆列表",
			pageSize : 10,
			columns : [
				{title : "最终<br>车牌",field : "car_license_number"},
				{title : "车辆<br>类型",field : "vip_type",formatter : Index.mData.getVipType,align:'center'},
				{title : "入场<br>时间",field : "enter_time",align:'center'},
				{title : "入场<br>通道",field : "enter_channel",align:'center',formatter : getChannelName},
				{title : "入场<br>通行<br>类型",field : "enter_pass_mode",align : "center",formatter : Index.mData.getPassMode},
				{title : "入场<br>车牌<br>图片",field : "enter_car_license_picture",align:'center',
					formatter : function(v,r,i){
						v = v || "";
						return "<img data-index='"+i+"' onerror='Index.onImgError(this)' ms-click='showPic(\"enter_car_full_picture\")' class='cpointer' src='" +
							Index.dealPicSrc(v) +
							"' height='30' alt='车牌图片' ms-widget='tooltip' data-tooltip-content='点击查看大图'>";
					}
				},
				{title : "出场<br>时间",field : "leave_time",align:'center'},
				{title : "出场<br>通道",field : "leave_channel",align:'center',formatter : getChannelName},
				{title : "出场<br>通行<br>类型",field : "leave_pass_mode",align : "center",formatter : Index.mData.getPassMode},
				{title : "出场<br>车牌<br>图片",field : "leave_car_license_picture",align:'center',
					formatter : function(v,r,i){
						return "<img data-index='"+i+"' onerror='Index.onImgError(this)' ms-click='showPic(\"leave_car_full_picture\")' class='cpointer' src='" +
							Index.dealPicSrc(v) +
							"' height='30' alt='车牌图片' ms-widget='tooltip' data-tooltip-content='点击查看大图'>";
					}
				},
				{title : "停车<br>时长",field : "stopping_time",align:'center',
					formatter : function(v){
						if(!v && v !== 0) return "--";
						var hours = v / 60 / 60;
						var d = parseInt(hours / 24);
						var _h = hours - d * 24;
						var h = parseInt(_h);
						var m = (_h - h) * 60;
						return d + "天" + h + "小时" + parseInt(m) + '分钟';
					}
				},
				{title : "实收",field : "actual_receivable",align : "center"},
				{title : "应收",field : "received_amount",align : "center"},
				{title : "入场<br>操作<br>员",field : "enter_operator",align : "center"},
				{title : "出场<br>操作<br>员",field : "leave_operator",align : "center"}
			],
			showPic : function(key){
				var list = avalon.vmodels.$carList.data;
				var imgs = [];
				for(var i=0,ii;ii=list[i++];){
					imgs.push({
						src : Index.dealPicSrc(ii[key])
					});
				}
				var $win = avalon.vmodels.$picWin;
				$win.imgs = imgs;
				$win.curIndex = +this.getAttribute("data-index");
				$win.open();
			}
		},
		$picWinOpts : {
			title : "浏览大图",
			curIndex : 0,
			next : function(){
				var items = document.querySelectorAll("#carousel .item");
				for(var i=0,ii=items.length;i<ii;i++){
					var $item = avalon(items[i]);
					if($item.hasClass("active")){
						if(i === ii - 1){
							var j = 0;
						}else{
							j = i + 1;
						}
						$item.addClass("left");
						var next = items[j];
						next.classList.add("next");
						next.offsetWidth;
						next.classList.add("left");
						return;
					}
				}
			},
			prev : function(){
				var items = document.querySelectorAll("#carousel .item");
				for(var i=0,ii=items.length;i<ii;i++){
					var $item = avalon(items[i]);
					if($item.hasClass("active")){
						if(i === 0){
							var j = ii - 1;
						}else{
							j = i - 1;
						}
						$item.addClass("right");
						var prev = items[j];
						prev.classList.add("prev");
						prev.offsetWidth;
						prev.classList.add("right");
						return;
					}
				}
			},
			imgs : [],
			afterShow : function(isInit){
				avalon.each(document.querySelectorAll("#carousel .item"),function(i,el){
					el.addEventListener(avalon.support.transitionend,function(e){
						e.stopPropagation();
						e.preventDefault();
						if(e.target !== this) return;
						var $this = avalon(this);
						this.classList.remove('left');
						this.classList.remove("right");
						if($this.hasClass("active")){
							this.classList.remove("active");
						}else if($this.hasClass("next")){
							this.classList.remove("next");
							this.classList.add("active");
						}else if($this.hasClass("prev")){
							this.classList.remove("prev");
							this.classList.add("active");
						}
					});
				});
			}
		},
		model : {
			sInDateStr : '',
			eInDateStr : '',
			sOutDateStr : "",
			eOutDateStr : "",
			in_operate_name : "",
			out_operate_name : "",
			vip_type : "",
			car_license_number : ""
		},
		inOperUsers : [],
		outOperUsers : []
	});
	avalon.scan();
	function getChannelName(v){
		for(var i=0,ii;ii=entrance_channel_list[i++];){
			if(ii.entrance_channel_seq === v){
				return ii.entrance_name;
			}
		}
		return '--';
	}
	function setTime(key,d){
		var obj = Index.getRange(car_out_list,key);
		if(obj && obj.min && obj.max){
			content.model["s"+d+"DateStr"] = obj.min;
			content.model["e"+d+"DateStr"] = obj.max;
		}else{
			var nowStr = avalon.filters.date(new Date(),"yyyy-MM-dd hh:mm:ss");
			content.model["s"+d+"DateStr"] = "";
			content.model["e"+d+"DateStr"] = nowStr;
		}
		$("#s"+d+"TimePicker,#e"+d+"TimePicker").datetimepicker("update");
	}
	var car_out_list;
	var entrance_channel_list;
	//基本信息指令
	Index.websocket.send({
		command : "GET_PARKING_LOT_BASE_DATE",
		biz_content : {
			request_time : avalon.filters.date(new Date(),"yyyy-MM-dd HH:mm:ss")
		}
	},document.body,function(data){
		entrance_channel_list = data.entrance_channel_list;
		Index.init(function(){
			Index.websocket.send({
				command : "GET_CAR_OUT_RECORD"
			},document.body,function(data){
				car_out_list = data.car_out_list;
				//日期
				setTime("enter_time","In");
				setTime("leave_time","Out");
				content.inOperUsers = [{value : '空',text : "空"}].concat(Index.getUnsameVal(car_out_list,"enter_operator",true));
				content.outOperUsers = [{value : '空',text : "空"}].concat(Index.getUnsameVal(car_out_list,"leave_operator",true));
				avalon.vmodels.$carList.loadFrontPageData(car_out_list);
			});
		},document.body,data);
	});
	$("#sInTimePicker,#eInTimePicker,#sOutTimePicker,#eOutTimePicker").datetimepicker(Index.getDateTimePickerOpts({startView : 2}));
});