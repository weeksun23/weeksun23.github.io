define(function(){
	//var host = "13531307642.xicp.net";
	//var host = "127.0.0.1";
	var host = "dwdtec.vicp.net";
	var url = "ws://" + host + ":51601";
	var socket;
	var timeout = 5000;
	var socketHelper = {
		fullImgUrl : "http://" + host + ":8088/FullPic/",
		plateImgUrl : "http://" + host + ":8088/PlateNumberPic/",
		//是否登陆页发的请求
		login : false,
		callbacks : {},
		send : function(order,area){
			if(!socketHelper.login){
				//非登录页发的请求都必须进行登录验证
				var account = localStorage.getItem("curAccount");
				if(!account){
					location.href = "login.html";
					return;
				}
				var key = "wwwcharge-login-" + account;
				var cache = localStorage.getItem(key);
				if(!cache || !+cache){
					//缓存非数字
					localStorage.removeItem(key);
					location.href = "login.html";
					return;
				}
				var time = +cache;
				var now = new Date().getTime();
				if(now - time > 30 * 60 * 1000){
					//30分钟没操作
					localStorage.removeItem(key);
					location.href = "login.html";
					return;
				}
				//更新登录缓存
				localStorage.setItem(key,now);
			}
			var uuid = generateID();
			order = avalon.mix({
				command : null,
				message_id : uuid,
				device_id : "0000000000123456789",
				sign_type : "MD5",
				sign : "21234561231561615461123",
				charset : "UTF-8",
				timestamp : avalon.filters.date(new Date(),"yyyyMMddHHmmss"),
				biz_content : {
					//
				}
			},order);
			area && avalon(area).loading();
			//countTime(func,area);
			avalon.log("======发送指令======",order);
			excutingOrder[uuid] = new OrderHelper(order);
		}
	};
	var excutingOrder = {};
	function generateID() {
	    return String(Math.random() + Math.random()).replace(/\d\.\d{4}/, "");
	}
	function OrderHelper(order){
		this.order = order;
		this.inter = null;
		this.start();
	}
	OrderHelper.prototype.start = function(){
		var me = this;
		this.inter = setTimeout(function(){
			avalon.log("======连接超时======");
			if(socket){
				socket.close();
				socket = null;
			}
			me.start();
		},timeout);
		this.send();
	};
	OrderHelper.prototype.send = function(){
		var me = this;
		if(!socket){
			socket = new WebSocket(url);
			socket.onmessage = function(e){
				var data = JSON.parse(e.data);
				var message_id = data.message_id;
				var target = excutingOrder[message_id];
				if(target){
					clearTimeout(target.inter);
					delete excutingOrder[message_id];
				}
				avalon.log("======收到回复======",data.command,data);
				var callback = socketHelper.callbacks[data.command];
				callback && callback.call(e,data.biz_content);
			};
			socket.onopen = function(){
				socket.send(JSON.stringify(me.order));
			};
		}else{
			socket.send(JSON.stringify(me.order));
		}
	};
	return socketHelper;
});