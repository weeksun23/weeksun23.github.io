define(["./configure","./connect"],function(Configure,Connection){
	"use strict";
	var Bind = Configure.bind;
	Configure.mix(Configure.prototype,{
		init : function(){
			//编辑模式
			this.edit = true;
			//当前选中的path
			this.curPath = null;
			//存放所有选择的img元素
			this.clickEl = [];
			//连接类实例
			this.connect = new Connection(this);
		},
		//清空所有或特定选择的元素
		clearChoose : function(target){
			var clickEl = this.clickEl;
			for(var i=0,ii=clickEl.length;i<ii;i++){
				var el = clickEl[i];
				if(target){
					if(el.id === target.id){
						el.data("circleSet").method("hide");
						clickEl.splice(i,1);
						return;
					}
				}else{
					var circle = el.data("circleSet");
					circle && circle.hide();
				}
			}
			if(!target){
				clickEl.length = 0;
			}
		},
		//保存数据
		saveData : function(){
			var paper = this.paper;
			var obj = {};
			paper.forEach(function(el){
				var type = el.data("type");
				if(type){
					var result = Configure.core[type].toData(el,this);
					if(result){
						var arr = obj[type];
						if(!arr){
							arr = obj[type] = [];
						}
						arr.push(result);
					}
				}
			},this);
			obj.relation = this.connect.relation;
			return JSON.stringify(obj);
		},
		removeEl : function(el){
			var type = el.data("type");
			var connect = this.connect;
			//先解除连接关系
			connect.remove(el.id);
			if(type === 'device' || type === "line"){
				var set = el.data("circleSet");
				if(type === "line"){
					var other = el.data("other");
					other && other.remove();
					if(this.curPath === el){
						//取消选择
						this.curPath = null;
					}
					if(set){
						//解除连接关系
						set.forEach(function(el){
							this.remove(el.id);
						},connect);
					}
				}else{
					//取消选择
					this.clearChoose(el);
				}
				set && set.method("remove");
			}
			el.remove();
		},
		removeElConn : function(el){
			var connect = this.connect;
			var type = el.data("type");
			if(type === "line"){
				var set = el.data("circleSet");
				//解除连接关系
				set.forEach(function(el){
					this.remove(el.id);
				},connect);
			}else{
				connect.remove(el.id);
			}
		}
	});
	(function(){
		function getElIdByTempId(paper,tempId){
			var result;
			paper.forEach(function(el){
				if(tempId === el.data("tempId")){
					result = el.id;
					return false;
				}
			});
			return result;
		}
		Configure.prototype.restoreRelation = function(relation){
			var newRelation = this.connect.relation = {};
			var paper = this.paper;
			for(var i in relation){
				var connArr = relation[i];
				if(connArr && connArr.length > 0){
					var newConnArr = [];
					for(var j=0,jj;jj=connArr[j++];){
						newConnArr.push({
							id : getElIdByTempId(paper,jj.id),
							position : jj.position
						});
					}
					newRelation[getElIdByTempId(paper,Number(i))] = newConnArr;
				}
			}
		};
	})();
	/***************************静态绑定***************************/
	(function(){
		function edage(x,y,w,h,configure){
			var maxX = configure.paperW;
			var maxY = configure.paperH;
			//不能滑出边缘
			if(x < 0){
				x = 0;
			}else if(x + w > maxX){
				x = maxX - w;
			}
			if(y < 0){
				y = 0;
			}else if(y + h > maxY){
				y = maxY - h;
			}
			return {
				x : x,
				y : y
			};
		}
		function pathDragging(configure,dx,dy){
			var arr = Raphael.parsePathString(this.sPath);
			var posArr = [];
			for(var i=0,ii=arr.length;i<ii;i++){
				var item = arr[i];
				item[1] += dx;
				item[2] += dy;
				if(i === 0 || i === ii - 1){
					posArr.push([item[1],item[2]]);
				}
			}
			var str = arr.toString();
			this.attr("path",str).noSel = true;
			var target = this;
			var other = this.data("other");
			if(other){
				//平移带虚线的管道时 必须同时 移动另一条路径
				other.attr("path",str);
				if(!this.data("main")){
					//同时移动虚线管道两端的连线圆
					target = other;
				}
			}
			var set = target.data("circleSet");
			if(set){
				set.move(posArr,function(circle){
					configure.connect.circleMove(circle,dx,dy,true);
				});
			}
		}
		function pathStartDrag(configure){
			this.sPath = this.attr("path");
			this.noSel = false;
			var set = this.data("circleSet");
			if(set){
				for(var i=0,circle;circle=set[i];i++){
					configure.connect.beforeCircleMove(circle);
					if(i === 0){
						var connectedArr = circle.connectedArr;
						if(connectedArr && connectedArr.length > 0){
							var els = connectedArr[0].els;
							var target = set[1];
							for(var j=0,el;el=els[j++];){
								if(el.id === target.id){
									//如果第一个circle所关联的组件包含了另一端的circle 
									//则说明连接的组件闭合形成循环 
									//另一端就不用再获取关联组件了
									return;
								}
							}
						}
					}
				}
			}
		}
		function pathEndDrag(configure){
			this.sPath = null;
			var set = this.data("circleSet");
			if(set){
				set.forEach(function(circle){
					configure.connect.afterCircleMove(circle);
				});
			}
			var me = this;
			setTimeout(function(){
				//让选中元素的事件方法先触发
				me.noSel = false;
			});
		}
		var dragFunc = {
			path : function(configure,target){
				target = target || this;
				this.drag(function(dx,dy){
					pathDragging.call(target,configure,dx,dy);
				},function(){
					pathStartDrag.call(target,configure);
				},function(){
					pathEndDrag.call(target,configure);
				});
			},
			image : function(configure){
				this.drag(function(dx,dy){
					//不能滑出边缘
					var bbox = this.getBBox();
					var obj = edage(this.sX + dx,this.sY + dy,this.attr("width"),this.attr("height"),configure);
					dx = obj.x - this.sX;
					dy = obj.y - this.sY;
					configure.connect.move(this,dx,dy);
					this.noSel = true;
				},function(){
					configure.connect.beforeMove(this);
					this.noSel = false;
				},function(){
					configure.connect.afterMove(this);
					var me = this;
					setTimeout(function(){
						//setTimeout让选中元素的事件方法先触发
						me.noSel = false;
					});
					var type = this.data("type");
					if(type === "connector"){
						//drop下连接器
						//先查看还有连接点可以连接否
						var points = this.data("connectPoints");
						var canConnect = configure.connect.getCanConnectPoints(this);
						if(canConnect.length === 0){
							return;
						}
						var me = this;
						//取connector中点
						var x = me.attr("x") + me.attr("width") / 2;
						var y = me.attr("y") + me.attr("height") / 2;
						//是否 drop在设备上
						configure.paper.forEach(function(el){
							if(el.type === 'image'){
								var type = el.data("type");
								if(type === "device"){
									var bbox = el.getBBox();
									if(Raphael.isPointInsideBBox(bbox, x, y)){
										//开始连接
										configure.connect.connectorToDevice(me,el,bbox,x,y,canConnect);
										return false;
									}
								}
							}
						});
					}
				});
			},
			circle : function(configure){
				this.drag(function(dx,dy){
					configure.connect.circleMove(this,dx,dy);
				},function(){
					configure.connect.beforeCircleMove(this.toFront());
				},function(e){
					configure.connect.afterCircleMove(this);
					//如果drop下的是路径两端的连线圆
					if(this.data("typeVal") === 'pathCircle'){
						if(!configure.connect.isConnect(this.id)){
							var x = this.attr("cx");
							var y = this.attr("cy");
							var me = this;
							configure.paper.forEach(function(el){
								var type = el.data("type");
								if(type === "connector" || type === 'device'){
									var bbox = el.getBBox();
									if(Raphael.isPointInsideBBox(bbox,x,y)){
										configure.connect.pathToConnector(me,el,bbox,x,y);
										return false;
									}
								}
							});
						}
					}
				});
			}
		};
		Bind.drag = function(el,configure,target){
			dragFunc[el.type].call(el,configure,target);
			return Bind;
		};
	})();
	(function(){
		//判断组件是否被选中
		function isSelected(el){
			var set = el.data("circleSet");
			if(!set) return false;
			var re = true;
			//查看第一个元素是否隐藏
			set.forEach(function(el){
				re = el.node.style.display !== 'none';
				return false;
			});
			if(re){
				return set;
			}
			return re;
		}
		function pathClick(configure){
			var paper = configure.paper;
			if(this.noSel) return;
			var re = isSelected(this);
			if(re){
				re.method("hide");
				configure.curPath = null;
			}else{
				//取消选中当前的path
				configure.curPath && configure.curPath.data("circleSet").method("hide");
				var set = this.data("circleSet");
				if(!set){
					var sp = this.getPointAtLength(0),
						ep = this.getPointAtLength(this.getTotalLength());
					var newSet = paper.set();
					var id = this.id;
					newSet.push(
						configure.add("circle","pathCircle",[sp.x,sp.y],{
							id : id,position : 0,bgColor : "#d2d2d2"
						}),
						configure.add("circle","pathCircle",[ep.x,ep.y],{
							id : id,position : 1,bgColor : "#d2d2d2"
						})
					);
					this.data("circleSet",newSet);
				}else{
					set.method("show").method("toFront");
				}
				configure.curPath = this;
			}
		}
		var clickFunc = {
			path : function(configure,target){
				this.click(function(){
					pathClick.call(target || this,configure);
				});
			},
			image : function(configure){
				this.click(function(){
					var paper = configure.paper;
					if(this.noSel) return;
					//选择或取消选择el
					//目前只支持单选
					var re = isSelected(this);
					if(re){
						re.method("hide");
					}else{
						configure.clearChoose();
						var set = this.data("circleSet");
						if(!set){
							var bbox = this.getBBox();
							var newSet = paper.set();
							var id = this.id;
							newSet.push(
								configure.add("circle","imgCircle",[bbox.x,bbox.y],{
									id : id,position : 0
								}),
								configure.add("circle","imgCircle",[bbox.x2,bbox.y],{
									id : id,position : 1
								}),
								configure.add("circle","imgCircle",[bbox.x,bbox.y2],{
									id : id,position : 2
								}),
								configure.add("circle","imgCircle",[bbox.x2,bbox.y2],{
									id : id,position : 3
								})
							);
							this.data("circleSet",newSet);
						}else{
							set.method("show");
						}
						//加入选中数组
						configure.clickEl.push(this);
					}
				});
			}
		};
		Bind.click = function(el,configure,target){
			clickFunc[el.type].call(el,configure,target);
			return Bind;
		};
	})();
	/***************************扩展***************************/
	(function(){
		function getPathCircleData(configure,path){
			var set = path.data("circleSet");
			if(set){
				var result = [],
					isSave = false;
				set.forEach(function(el){
					//如果其中一个连线圆已被连接 则需要保存这两个连线圆数据
					if(!isSave && configure.connect.isConnect(el.id)){
						isSave = true;
					}
					result.push({
						cx : el.attr('cx'),
						cy : el.attr('cy'),
						tempId : el.id,
						position : el.data("belong").position
					});
				});
				return isSave ? result : null;
			}
			return null;
		}
		function getImgObj(el){
			var bbox = el.getBBox();
			//image元素
			var src = el.attr("src");
			src = src.substring(src.lastIndexOf("/") + 1).split(".")[0];
			return {
				x : bbox.x,
				y : bbox.y,
				width : bbox.width,
				height : bbox.height,
				src : src,
				tempId : el.id
			};
		}
		Configure.extend("line",{
			beforeInit : function(initParams,attrParams){
				var x = initParams[0];
				if(typeof x == 'number'){
					var y = initParams[1];
					return [["M",x," ",y,"L",x + attrParams._len," ",y].join("")];
				}else{
					return [x];
				}
			},
			afterInit : function(el,attrParams){
				el.attr(Configure.mix(attrParams._attr,attrParams.attr,true));
				Bind.click(el,this).drag(el,this);
			},
			double : function(path,attrParams){
				var innerAttr = Configure.mix(attrParams._innerAttr,attrParams.attr,true);
				var outerAttr = Configure.mix(attrParams._outerAttr,attrParams.outerAttr,true);
				path.attr(innerAttr);
				var outerPath = this.paper.path(path.attr("path")).attr(outerAttr);
				outerPath.toFront().data("other",path);
				path.toFront().data("other",outerPath).data("main",true);
				//点击outerPath时触发path的点击事件
				Bind.click(outerPath,this,path)
				//drag outerPath时触发path的drag事件
					.drag(outerPath,this,path);
			},
			toData : function(el,typeVal){
				var obj = {
					typeVal : typeVal,
					path : el.attr("path").toString(),
					attr : {
						stroke : el.attr("stroke"),
						"stroke-width" : el.attr("stroke-width")
					},
					tempId : el.id,
					circles : getPathCircleData(this,el)
				};
				return obj;
			},
			toData_dotted : function(el,obj){
				obj.attr["stroke-dasharray"] = el.attr("stroke-dasharray");
			},
			toData_double : function(el,obj){
				var outer = el.data("other");
				obj.attr["stroke-dasharray"] = el.attr("stroke-dasharray");
				obj.outerAttr = {
					stroke : outer.attr("stroke"),
					"stroke-width" : outer.attr("stroke-width")
				};
			},
			toEl : function(obj,core){
				var el = core.line.call(this,obj.typeVal,[obj.path],{
					attr : obj.attr,
					outerAttr : obj.outerAttr
				});
				var circles = obj.circles;
				if(circles){
					var set = this.paper.set();
					for(var i=0,item;item = circles[i++];){
						var circle = core.circle.call(this,"pathCircle",[item.cx,item.cy],{
							id : el.id,
							position : item.position
						});
						set.push(circle.data("tempId",item.tempId).hide());
					}
					el.data("circleSet",set);
					el.data("tempId",obj.tempId);
				}
			}
		}).extend("circle",{
			defaultAttr : {
				_stroke : "green",
				_fill : "#66ff33",
				_size : 5
			},
			beforeInit : function(initParams,attrParams){
				return initParams.concat(attrParams._size);
			},
			init : function(x,y,r){
				return this.circle(x,y,r);
			},
			afterInit : function(circle,attrParams){
				if(attrParams.position !== undefined){
					var cursor = ["nw-resize","ne-resize","sw-resize","se-resize"][attrParams.position];
				}else{
					cursor = "nw-resize";
				}
				circle.attr({stroke : attrParams._stroke,fill : attrParams.bgColor || attrParams._fill,cursor : cursor})
					.data("belong",{id : attrParams.id,position : attrParams.position})
					.toFront();
				Bind.drag(circle,this);
			}
		});
		(function(){
			function getPoints(str){
				if(!str) return null;
				var arr = [];
				var points = JSON.parse(str);
				for(var i=0,ii=points.length;i<ii;i++){
					arr.push({
						x : points[i][0],
						y : points[i][1]
					});
				}
				return arr;
			}
			function common(el,attrParams){
				var points = attrParams.points;
				points && el.data("connectPoints",typeof points == 'object' 
					? points : getPoints(points));
				Bind.drag(el,this);
			}
			function makeImg(configure,type,obj,core){
				var img = core[type].call(configure,obj.typeVal,[Configure.path + type + "/" + obj.src + ".png",
                	obj.x,obj.y,obj.width,obj.height],{
                	points : Configure.imgLib[obj.src].points
				});
				img.data("tempId",obj.tempId);
			}
			Configure.extend("connector",{
				afterInit : function(connector,attrParams){
					common.call(this,connector,attrParams);
				},
				toData : function(el){
					return getImgObj(el);
				},
				toEl : function(obj,core){
					makeImg(this,"connector",obj,core);
				}
			}).extend("device",{
				afterInit : function(device,attrParams){
					common.call(this,device,attrParams);
					Bind.click(device,this);
				},
				toData : function(el){
					return getImgObj(el);
				},
				toEl : function(obj,core){
					makeImg(this,"device",obj,core);
				}
			});
		})();
	})();
	//扩展set
	Raphael.st.method = function(method){
		var oArg = arguments;
		return this.forEach(function(el){
			el[method].apply(el,Array.prototype.splice.call(oArg,1));
		});
	};
	//设置set中每一个元素的cx cy坐标
	Raphael.st.move = function(posArr,func){
		var i = 0;
		return this.forEach(function (el) {
			var item = posArr[i++];
			item && el.attr({
				cx : item[0],
				cy : item[1]
			});
			func && func(el,item[0],item[1]);
	    });
	};
	return Configure;
});