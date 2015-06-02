define(function(){
	var host = "13531307642.xicp.net";
	var url = "ws://" + host + ":51601";
	var socket;
	var inter;
	//计时
	function countTime(func,area){
		var time = 0;
		inter = setInterval(function(){
			time += 1000;
			if(time === socketHelper.timeout){
				func && func('timeout');
				area && avalon(area).loading(true);
				clearInterval(inter);
			}
		},1000);
	}
	var socketHelper = {
		fullImgUrl : "http://" + host + ":8088/FullPic/",
		plateImgUrl : "http://" + host + ":8088/PlateNumberPic/",
		//是否登陆页发的请求
		timeout : 5000,
		login : false,
		callbacks : {},
		send : function(order,area){
			if(!socketHelper.login){
				//非登录页发的请求都必须进行登录验证
				var href = location.href;
				if(href.indexOf("?") === -1){
					location.href = "login.html";
					return;
				}
				var account = href.split("?")[1];
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
			order = avalon.mix({
				command : null,
				message_id : "20150528220935",
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
			if(!socket){
				try{
					socket = new WebSocket(url);
				}catch(ex){
					avalon.log(ex);
					return;
				}
				socket.onmessage = function(e){
					var data = JSON.parse(e.data);
					avalon.log("======收到回复======",data.command,data);
					var callback = socketHelper.callbacks[data.command]
					callback && callback.call(e,data.biz_content);
				};
				socket.onopen = function(){
					socket.send(JSON.stringify(order));
				};
			}else{
				socket.send(JSON.stringify(order));
			}
		}
	};
	return socketHelper;
});