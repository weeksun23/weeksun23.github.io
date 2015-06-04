require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
require([
	"common/index",
	"common/table/avalon.table",
	"common/tooltip/avalon.tooltip",
	"lib/datetimepicker/bootstrap-datetimepicker-module"
],function(Index){
	Index.top.curIndex = 1;
	var content = avalon.define({
		$id : "content",
		$carListOpts : {
			title : "车辆列表",
			columns : [
				{title : "序号",field : "n"},
				{title : "最终车牌",field : "car_license_number",
					formatter : function(v){
						return "<a href='javascript:void(0)' ms-click='correctCarNum' ms-widget='tooltip' data-tooltip-content='点击纠正车牌'>" +
							v + "</a>";
					}
				},
				{title : "入场识别车牌",field : "enter_car_license_number"},
				{title : "车牌图片",field : "enter_car_license_picture",
					formatter : function(v){
						if(!v) return;
						return "<img ms-click='showPic' class='cpointer' src='"+v+"' height='50' alt='车牌图片' ms-widget='tooltip' data-tooltip-content='点击查看大图'>";
					}
				},
				{title : "入场时间",field : "enter_time"},
				{title : "入场通道",field : "enter_channel"},
				{title : "车辆类型",field : "enter_vip_type"},
				{title : "放行模式",field : "pass_type"},
				{title : "置信度",field : "enter_recognition_confidence"},
				{title : "值班人员",field : "in_operate_name"}
			],
			frontPageData : [
				{n : "234534",car_license_number : "粤XHN161",enter_car_license_picture : 'image/plate.jpg'},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"},
				{n : "234534",car_license_number : "粤XHN161"}
			],
			correctCarNum : function(){
				avalon.vmodels.$correctWin.open();
			},
			showPic : function(){
				avalon.vmodels.$picWin.open();
			}
		},
		$correctWinOpts : {
			title : "纠正车牌",
			buttons : [{
				text : '非机动车',theme : "danger"
			},{
				text : '无牌车',theme : "primary"
			},{
				text : "确认纠正",theme : "success"
			},{
				text : "取消",close : true
			}],
			provinceData : [
				[['京','津','粤','泸'],['浙','苏','湘','渝']],
				[['云','豫','皖','陕'],['桂','新','青','琼']],
				[['闽','蒙','辽','宁'],['鲁','晋','吉','冀']],
				[['黑','甘','鄂','赣'],['贵','川','藏']]
			],
			curChoose : "粤",
			doChoose : function(j){
				avalon.vmodels.$correctWin.curChoose = j;
			}
		},
		$picWinOpts : {
			title : "浏览大图",
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
			imgs : [{
				src : "image/full.jpg"
			},{
				src : "image/plate.jpg"
			},{
				src : "image/full.jpg"
			}],
			afterShow : function(isInit){
				if(isInit){
					avalon.each(document.querySelectorAll("#carousel .item"),function(i,el){
						el.addEventListener(avalon.support.transitionend,function(){
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
			}
		}
	});
	avalon.scan();
	$("#inTimePicker").datetimepicker({
		language:  'zh-CN',
	    format : "yyyy-mm-dd hh:ii:ss",
	    weekStart: 1,
	    todayBtn:  1,
		autoclose: 1,
		todayHighlight: 1,
		startView: 2
	});
});