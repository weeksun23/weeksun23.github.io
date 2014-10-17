define(function(){
	"use strict";
	function Connection(configure){
		//当前的configure实例
		this.configure = configure;
		/*
		储存所有连接关系
		{
			1 : [{id : 2,position : ...},{},{}],
			2 : [{id : 1,position : ...}],
			3 : []
			...
		}
		*/
		this.relation = {};
	}
	Connection.prototype = {
		set : function(){
			var relation = this.relation;
			for(var i=0,ii=arguments.length;i<ii;i = i + 2){
				var item = relation[arguments[i]];
				if(!item){
					item = relation[arguments[i]] = [];
				}
				item.push(arguments[i + 1]);
			}
		},
		remove : function(id){
			var relation = this.relation;
			var removeCon = relation[id];
			if(removeCon){
				for(var i=0,ii=removeCon.length;i<ii;i++){
					var targetCon = relation[removeCon[i].id];
					if(targetCon){
						for(var j=0,jj=targetCon.length;j<jj;j++){
							if(targetCon[j].id === id){
								targetCon.splice(j,1);
								if(targetCon.length === 0){
									delete relation[removeCon[i].id];
								}
								break;
							}
						}
					}
				}
				delete relation[id];
			}
		},
		/**
		 * 遍历所有连接到id的连接对象，查看point点是否已被连接，是则返回true否则返回false
		 */
		isExist : function(id,point){
			var relation = this.relation;
			var conArr = relation[id];
			if(!conArr) return false;
			for(var i=0,ii=conArr.length;i<ii;i++){
				var target = conArr[i].position;
				if(target && point.x === target.x && point.y === target.y){
					return true;
				}
			}
			return false;
		},
		isConnect : function(id){
			var item = this.relation[id];
			return item && item.length > 0;
		},
		connectorToDevice : connectorToDevice,
		getCanConnectPoints : getCanConnectPoints,
		pathToConnector : pathToConnector,
		beforeCircleMove : function(circle){
			var typeVal = circle.data("typeVal");
			var item = circle.data("belong");
			var paper = this.configure.paper;
			var target = paper.getById(item.id);
			var relation = this.relation;
			if(typeVal === "imgCircle"){
				var bbox = target.getBBox();
				var imgId = target.id;
				var conArr = relation[imgId];
				var result = [];
				if(conArr){
					for(var j=0,jj;jj=conArr[j++];){
						var obj = {};
						var pos = jj.position;
						obj.x = bbox.x + (obj._x = pos.x) * bbox.width;
						obj.y = bbox.y + (obj._y = pos.y) * bbox.height;
						var el = paper.getById(jj.id);
						var els = [el];
						getConnectedEls(paper,relation,el,els,imgId);
						obj.els = els;
						setStartXStartY(els);
						result.push(obj);
					}
				}
				
			}else if(typeVal === "pathCircle"){
				var circleId = circle.id;
				var result = [];
				var conArr = relation[circleId];
				if(conArr){
					//pathCircle最多只能连接一个组件 所以conArr的length最大为1
					for(var j=0,jj;jj=conArr[j++];){
						var obj = {};
						var el = paper.getById(jj.id);
						var els = [el];
						getConnectedEls(paper,relation,el,els,circleId);
						setStartXStartY(els);
						obj.els = els;
						result.push(obj);
					}
				}
			}
			circle.connectedArr = result;
			circle.sX = circle.attr("cx");
			circle.sY = circle.attr("cy");
			circle.target = target;
			circle.position = item.position;
		},
		//unChangePath为true 不改变路径与circle,否则改变
		circleMove : function(circle,dx,dy,unChangePath){
			var typeVal = circle.data("typeVal");
			if(!unChangePath){
				var cx = circle.sX + dx;
				var cy = circle.sY + dy;
			}
			var paper = this.configure.paper;
			if(typeVal === "imgCircle"){
				var result = changeImgByCircle(circle,cx,cy);
				var connectedArr = circle.connectedArr;
				for(var i=0,ii;ii = connectedArr[i++];){
					var dx = result.x + result.w * ii._x - ii.x;
					var dy = result.y + result.h * ii._y - ii.y;
					if(dx === 0 && dy === 0){
						continue;
					}
					setXY(paper,ii.els,dx,dy);
				}
			}else if(typeVal === "pathCircle"){
				!unChangePath && changePathByCircle(circle,cx,cy);
				var connectedArr = circle.connectedArr || [];
				for(var i=0,ii;ii = connectedArr[i++];){
					setXY(paper,ii.els,dx,dy);
				}
			}
		},
		afterCircleMove : function(circle){
			circle.connectedArr = null;
			circle.target = null;
		},
		beforeMove : function(el){
			var els = [el];
			getConnectedEls(this.configure.paper,this.relation,el,els);
			el.connectedEls = els;
			setStartXStartY(els);
		},
		move : function(el,dx,dy){
			setXY(this.configure.paper,el.connectedEls,dx,dy);
		},
		afterMove : function(el){
			el.connectedEls = null;
		},
		setImgPosition : function(el,x,y){
			var dx = x - el.attr("x");
			var dy = y - el.attr("y");
			this.beforeMove(el);
			this.move(el,dx,dy);
			this.afterMove(el);
		}
	};
	function setCircleTarget(paper,circle){
		var item = circle.data("belong");
		circle.target = paper.getById(item.id);
		circle.position = item.position;
	}
	//通过circle改变img的size和position
	function changeImgByCircle(circle,cx,cy){
		var target = circle.target;
		var position = circle.position;
		var circles = target.data("circleSet"),
			is0 = position === 0,
			is2 = position === 2,
			is1 = position === 1,
			is3 = position === 3,
			MIN_SIZE = 16,
			bbox = target.getBBox(),
			newW = (is0 || is2) ? bbox.x2 - cx : cx - bbox.x,
			newH = (is0 || is1) ? bbox.y2 - cy : cy - bbox.y;
		if(newW < MIN_SIZE){
			newW = MIN_SIZE;
			cx = (is0 || is2) ? bbox.x2 - MIN_SIZE : bbox.x + MIN_SIZE;
		}
		if(newH < MIN_SIZE){
			newH = MIN_SIZE;
			cy = (is0 || is1) ? bbox.y2 - MIN_SIZE : bbox.y + MIN_SIZE;
		}
		if(is0 || is1){
			circles[is0 ? 1 : 0].attr({cy : cy});
			circles[is0 ? 2 : 3].attr({cx : cx});
		}else{
			circles[is2 ? 0 : 1].attr({cx : cx});
			circles[is2 ? 3 : 2].attr({cy : cy});
		}
		var targetX = (is0 || is2) ? cx : (cx - newW);
		var targetY = (is0 || is1) ? cy : (cy - newH);
		target.attr({
			width : newW,
			height : newH,
			x : targetX,
			y : targetY
		});
		circle.attr({
			cx : cx,
			cy : cy
		});
		return {
			w : newW,
			h : newH,
			x : targetX,
			y : targetY
		};
	}
	//通过circle改变路径
	function changePathByCircle(circle,cx,cy){
		var position = circle.position;
		var target = circle.target;
		var pathArr = Raphael.parsePathString(target.attr("path"));
		var ii = pathArr.length;
		var index = position === 0 ? 0 : ii - 1;
		for(var i=0;i<ii;i++){
			if(i === index){
				pathArr[i][1] = cx;
				pathArr[i][2] = cy;
			}
		}
		var str = pathArr.toString();
		var other = target.attr("path",str).data("other");
		if(other){
			other.attr("path",str);
		}
		circle.attr({
			cx : cx,
			cy : cy
		});
	}
	//递归获取el的所有连接组件 结果存放在els数组中
	function getConnectedEls(paper,relation,el,els,excludeId){
		var elId = el.id;
		var conArr = relation[elId];
		if(conArr){
			for(var i=0,item;item = conArr[i++];){
				var itemId = item.id;
				//忽略已递归过的 防止死循环
				if(itemId !== excludeId){
					var itemEl = paper.getById(itemId);
					els.push(itemEl);
					getConnectedEls(paper,relation,itemEl,els,elId);
				}
			}
		}
	}
	function setStartXStartY(els){
		for(var i=0,item;item = els[i++];){
			var type = item.type;
			if(type === 'image'){
				item.sX = item.attr("x");
				item.sY = item.attr("y");
				var set = item.data("circleSet");
				if(set){
					set.forEach(function(el){
						el.sX = el.attr("cx");
						el.sY = el.attr("cy");
					});
				}
			}else if(type === "circle"){
				item.sX = item.attr("cx");
				item.sY = item.attr("cy");
			}
		}
	}
	function setXY(paper,els,dx,dy){
		for(var i=0,item;item = els[i++];){
			var type = item.type;
			if(type === 'image'){
				item.attr({
					x : item.sX + dx,
					y : item.sY + dy
				});
				var set = item.data("circleSet");
				if(set){
					set.forEach(function(el){
						el.attr({
							cx : el.sX + dx,
							cy : el.sY + dy
						});
					});
				}
			}else if(type === "circle"){
				setCircleTarget(paper,item);
				changePathByCircle(item,item.sX + dx,item.sY + dy);
			}
		}
	}
	//获取两点距离
	function getPointDistance(p1,p2){
		return Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y - p1.y,2));
	}
	//获取连接点
	function getTargetPoint(arr,compareP){
		var index = 0,
			min;
		for(var i=0,ii=arr.length;i<ii;i++){
			var mid = getPointDistance(compareP,arr[i]);
			if(i === 0){
				min = mid;
				continue;
			}
			if(mid < min){
				min = mid;
				index = i;
			}
		}
		return index;
	}
	//连接器与设备相连
	function connectorToDevice(connector,device,deviceBbox,x,y,canConnect){
		var paper = this.configure.paper;
		var deviceCanConnect = this.getCanConnectPoints(device);
		//设备没有可以连接的点
		if(deviceCanConnect.length === 0) return;
		var points = [];
		var w = deviceBbox.width;
		var h = deviceBbox.height;
		var x1 = deviceBbox.x;
		var y1 = deviceBbox.y;
		//根据比例转换成相应坐标
		for(var i=0,ii=deviceCanConnect.length;i<ii;i++){
			points.push({
				x : x1 + w * deviceCanConnect[i].x,
				y : y1 + h * deviceCanConnect[i].y
			});
		}
		//找到与中心点最近的点的索引
		var index = getTargetPoint(points,{x : x,y : y});
		var target = deviceCanConnect[index];
		for(var i=0,ii=canConnect.length;i<ii;i++){
			var item = canConnect[i];
			if((target.x < 0.5 && item.x === 1) || (target.x > 0.5 && item.x === 0)
					|| (target.y < 0.5 && item.y === 1) || (target.y > 0.5 && item.y === 0)){
				break;
			}
		}
		if(i !== ii){
			//找到连接点item,将item与target相连
			var tx = points[index].x,
				ty = points[index].y;
			this.setImgPosition(connector,tx - connector.attr("width") * item.x,
					ty - connector.attr("height") * item.y);
			connectEffect(paper,tx,ty);
			//建立连接关系
			this.set(connector.id,{
				id : device.id,
				position : item
			},device.id,{
				id : connector.id,
				position : target
			});
		}
	}
	//获取el可以连接的点
	function getCanConnectPoints(el){
		var points = el.data("connectPoints");
		if(!points) return [];
		var canConnect = [];
		for(var i=0,ii=points.length;i<ii;i++){
			if(!this.isExist(el.id, points[i])){
				canConnect.push(points[i]);
			}
		}
		return canConnect;
	}
	//连接path和connector
	function pathToConnector(circle,connector,bbox,x,y){
		var paper = this.configure.paper;
		var points = connector.data("connectPoints");
		if(points){
			var w = bbox.width,
				h = bbox.height,
				arr = [];
			//获取所有可连接的点
			for(var i=0,ii=points.length;i<ii;i++){
				arr.push({
					x : bbox.x + w * points[i].x,
					y : bbox.y + h * points[i].y
				});
			}
			//获取与(X,Y)最近的点的索引
			var index = getTargetPoint(arr,{x : x,y : y});
			//查看该点是否已被连接了
			var point = points[index];
			if(!point || this.isExist(connector.id, point)){
				return;
			}
			//连接
			var tx = arr[index].x,
				ty = arr[index].y;
			setCircleTarget(paper,circle);
			changePathByCircle(circle,tx,ty);
			connectEffect(paper,tx,ty);
			//建立连接关系
			this.set(connector.id,{
				id : circle.id,
				position : point
			},circle.id,{
				id : connector.id,
				position : point
			});
		}
	}
	//连接动画效果
	function connectEffect(paper,x,y){
		var circle = paper.circle(x,y,8);
		circle.attr({
			stroke : "red",
			'stroke-opacity' : 0.7,
			fill : "red",
			'fill-opacity' : 0.7
		}).animate({
			'fill-opacity' : 0.1,
			'stroke-opacity' : 0.1,
			r : 30
		},400,'linear',function(){
			this.remove();
		});
	}
	return Connection;
});