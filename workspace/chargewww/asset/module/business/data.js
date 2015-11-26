define(function(){
	function getText(list,v){
		for(var i=0,ii;ii=list[i++];){
			if(ii.v === v) return ii.t;
		}
		return "";
	}
	var DATA = {
		car_license_color : [
			{v : "0",t : "不支持"},{v : "1",t : "白"},{v : "2",t : "银"},{v : "3",t : "灰"},
			{v : "4",t : "黑"},{v : "5",t : "红"},{v : "6",t : "深蓝"},{v : "7",t : "蓝"},
			{v : "8",t : "黄"},{v : "9",t : "绿"},{v : "10",t : "棕"},{v : "11",t : "粉"},
			{v : "12",t : "紫"},{v : "13",t : "深灰"}
		],
		car_license_type : [
			{v : "0",t : "未定义"},{v : "1",t : "蓝牌白色"},{v : "2",t : "黄牌黑字"},
			{v : "3",t : "黑牌白字"},{v : "4",t : '白牌'}
		],
		car_type : [
			{v : "0",t : "未定义"},{v : "1",t : "轿车"},{v : "2",t : "货车"},
			{v : "3",t : "其它"}
		],
		car_logo : [
			{v : "0",t : "其它"},{v : "1",t : "大众"},{v : "2",t : "别克"},{v : "3",t : "宝马"},
			{v : "4",t : "本田"},{v : "5",t : "标致"},{v : "6",t : "丰田"},{v : "7",t : "福特"},
			{v : "8",t : "日产"},{v : "9",t : "奥迪"},{v : "10",t : "马自达"},{v : "11",t : "雪佛兰"},
			{v : "12",t : "雪铁龙"},{v : "13",t : "现代"},{v : "14",t : "奇瑞"},{v : "15",t : "起亚"},
			{v : "16",t : "荣威"},{v : "17",t : "三菱"},{v : "18",t : "斯柯达"},{v : "19",t : "吉利"},
			{v : "20",t : "中华"},{v : "21",t : "沃尔沃"},{v : "22",t : "雷克萨斯"},{v : "23",t : "菲亚特"},
			{v : "24",t : "帝豪"},{v : "25",t : "东风"},{v : "26",t : "比亚迪"},{v : "27",t : "铃木"},
			{v : "28",t : "金杯"},{v : "29",t : "海马"},{v : "30",t : "五菱"},{v : "31",t : "江淮"},
			{v : "32",t : "斯巴鲁"},{v : "33",t : "英伦"},{v : "34",t : "长城"},{v : "35",t : "哈飞"},
			{v : "36",t : "五十铃"},{v : "37",t : "东南"},{v : "38",t : "长安"},{v : "39",t : "福田"},
			{v : "40",t : "夏利"},{v : "41",t : "奔驰"},{v : "42",t : "一汽"},{v : "43",t : "依维柯"},
			{v : "44",t : "力帆"},{v : "45",t : "一汽奔腾"},{v : "46",t : "皇冠"},{v : "47",t : "雷诺"},
			{v : "48",t : "JMC"},{v : "49",t : "MG名爵"},{v : "50",t : "凯马"},{v : "51",t : "众泰"},
			{v : "52",t : "昌河"},{v : "53",t : "厦门金龙"},{v : "54",t : "上海汇众"},{v : "55",t : "苏州金龙"},
			{v : "56",t : "海格"},{v : "57",t : "宇通"},{v : "58",t : "中国重汽"},{v : "59",t : "北奔重卡"},
			{v : "60",t : "华菱星马"},{v : "61",t : "跃进"},{v : "62",t : "黄海"}
		],
		pass_mode : [
			{v : "0",t : "未确定"},{v : "1",t : "自动放行"},
			{v : "2",t : "手动放行"},{v : "3",t : "异常放行"},
			{v : "4",t : "常开放行"}
		],
		//以下数据服务器获取更新覆盖
		vip_type : [
			{v : "0",t : "未知"},{v : "1",t : "临时车"},{v : "2",t : "本地VIP"},
			{v : "3",t : "会员车/月租车"}
		],
		getVipType : function(type){
			return getText(DATA.vip_type,type);
		},
		getCarLogo : function(v){
			return getText(DATA.car_logo,v);
		},
		getPassMode : function(v){
			return getText(DATA.pass_mode,v);
		},
		getPassType : function(v){
			if(v === "1"){
				return "严模式";
			}else if(v === '2'){
				return "宽模式";
			}else{
				return '未定义';
			}
		}
	};
	return DATA;
});