define(function(){
	//var host = "13531307642.xicp.net";
	//var host = "192.168.134.106";
	//var host = "dwdtec.vicp.net";
	var host = "127.0.0.1"
	var url = "ws://" + host + ":51601";
	var socket;
	//出错后重新连接时间
	var errorReconectTime = 5000;
	var socketHelper = {
		fullImgUrl : "http://" + host + ":8088/FullPic/",
		plateImgUrl : "http://" + host + ":8088/PlateNumberPic/",
		//fullImgUrl : "image/test/FullPic/",
		//plateImgUrl : "image/test/PlateNumberPic/",
		//是否登陆页发的请求
		login : false,
		callbacks : {},
		//不打印的指令
		noPrintOrder : "PUSH_CHANNEL_INFO",
		send : function(order,area,func,unPrint){
			if(!socketHelper.login){
				//非登录页发的请求都必须进行登录验证
				var personalInfo = Index.personalInfo;
				var now = new Date().getTime();
				if(now - personalInfo.loginTimeMillisecond > 30 * 60 * 1000){
					//30分钟没操作
					localStorage.removeItem(personalInfo.accountName);
					location.href = "login.html";
					return;
				}
				//更新登录缓存
				personalInfo.loginTimeMillisecond = now;
			}
			//获取uuid唯一标识改指令 以便回复获取对应的回调
			var uuid = generateID();
			order = avalon.mix({
				command : null,
				message_id : uuid,
				device_id : "0000000000123456789",
				sign_type : "MD5",
				sign : "21234561231561615461123",
				charset : "UTF-8",
				timestamp : avalon.filters.date(new Date(),"yyyyMMddHHmmss")
			},order);
			area && avalon(area).loading();
			!unPrint && avalon.log("======发送指令======",order);
			excutingOrder[uuid] = new OrderHelper(order,area,func,unPrint);
		}
	};
	var excutingOrder = {};
	function generateID() {
	    return String(Math.random() + Math.random()).replace(/\d\.\d{4}/, "");
	}
	function OrderHelper(order,area,func,unPrint){
		this.order = order;
		this.area = area;
		this.func = func;
		this.unPrint = unPrint;
		this.send();
	}
	OrderHelper.prototype.send = function(){
		var me = this;
		if(!socket){
			socket = new WebSocket(url);
			socket.onerror = function(e){
				avalon.log("======连接出错======",e);
				avalon.each(excutingOrder,function(i,v){
					//重新发送
					setTimeout(function(){
						v.send();
					},errorReconectTime);
				});
				socket.close();
				socket = null;
			};
			socket.onmessage = function(e){
				var data = JSON.parse(e.data);
				var message_id = data.message_id;
				var target = excutingOrder[message_id];
				if(target){
					if(socketHelper.noPrintOrder.indexOf(data.command) === -1 && !target.unPrint){
						avalon.log("======收到回复======",data.command,data);
					}
					//发送指令后的回调
					clearTimeout(target.inter);
					target.area && avalon(target.area).loading(false);
					target.func && target.func.call(e,data.biz_content);
					delete excutingOrder[message_id];
				}else{
					if(socketHelper.noPrintOrder.indexOf(data.command) === -1){
						avalon.log("======收到回复======",data.command,data);
					}
					//主动推送的指令
					var callback = socketHelper.callbacks[data.command];
					callback && callback.call(e,data.biz_content);
				}
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