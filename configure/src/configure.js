define(['./lib/raphael/raphael-cmd-min','./configure.imglib'],function(Raphael,imgLib){
	"use strict";
	/********************************paper**************************************/
	function Configure(paperId,w,h){
		this.paper = new Raphael(paperId,this.paperW = (w || 7500),this.paperH = (h || 7500));
		this.init && this.init();
	}
	Configure.prototype.add = function(type,typeVal,initParams,attrParams){
		return core[type].call(this,typeVal,initParams,attrParams);
	};
	Configure.prototype.loadData = function(data){
		data = JSON.parse(data);
		this.paper.clear();
		for(var i in data){
			if(i !== "relation"){
				var item = data[i];
				for(var j=0,obj;obj=item[j++];){
					core[i].toEl(obj,this);
				}
			}
		}
		if(this.edit){
			this.restoreRelation(data.relation);
		}
	};
	/********************************帮助函数**************************************/
	//空函数
	var noop = Configure.noop = function(){};
	//简单扩展
	var mix = Configure.mix = function(a,b,unChangeA){
		if(unChangeA){
			a = Configure.mix({},a);
		}else{
			a = a || {};
		}
		b = b || {};
		for(var i in b){
			if(b[i] !== undefined){
				a[i] = b[i];
			}
		}
		return a;
	};
	mix(Configure,{
		version : 1.0,
		init : function(path){
			Configure.path = path;
			if(!window.JSON){
				throw new Error("缺少JSON对象");
			}
		},
		imgLib : imgLib,
		log : function(){
			try{
				window.console && console.log.apply(console,arguments);
			}catch(e){}
		},
		//静态绑定
		bind : {}
	});
	/********************************扩展el**************************************/
	Raphael.el.rightClick = function(func){
		if(this.data("typeVal") === "double"){
			//double line路径，需同时为outerpath绑定事件
			var outerpath = this.data("other");
			var me = this;
			outerpath.mousedown(function(e){
				if(e.button === 2){
					func.call(me,e);
				}
			});
		}
		return this.mousedown(function(e){
			if(e.button === 2){
				func.call(this,e);
			}
		});
	};
	/********************************core**************************************/
	var core = Configure.core = {};
	/*
	扩展core
	每个属性都是一个方法，this指向当前configure实例,执行顺序为beforeInit > init > afterInit > [typeVal]
	beforeInit主要对传入参数进行处理若返回值为数组，则作为init的参数
	init接收Raphael对象初始化所需参数，并进行初始化，返回Raphael对象
		Paper.path([pathString])
		Paper.image(src, x, y, width, height)
		Paper.circle(x, y, r)
		Paper.rect(x, y, width, height, [r])
	[typeVal]init 根据typeVal进行初始化

	Configure.core.type(typeVal,initParams,attrParams)
	typeVal 必须为字符串
	initParams 必须为数组
	attrParams 必须为对象

	toData
	toData[-typeVal]
	*/
	var extend = Configure.extend = function(name,options){
		var exec = core[name];
		if(exec){
			mix(exec.options,options);
		}else{
			options = mix({
				//defaultAttr中的属性值约定以_开头
				defaultAttr : {},
				beforeInit : noop,
				init : noop,
				afterInit : noop
			},options);
			exec = core[name] = function(typeVal,initParams,attrParams){
				var target = exec.options;
				attrParams = attrParams || {};
				mix(attrParams,target.defaultAttr);
				var newParams = target.beforeInit.call(this,initParams,attrParams);
				//init的this指向paper
				var el = target.init.apply(this.paper,newParams || initParams);
				if(el){
					el.data({
						type : name,
						typeVal : typeVal
					});
				}
				target.afterInit.call(this,el,attrParams);
				target[typeVal] && target[typeVal].call(this,el,attrParams);
				return el;
			};
			exec.toData = function(el,configure){
				var typeVal = el.data("typeVal");
				var target = exec.options;
				var obj = target.toData && target.toData.call(configure,el,typeVal);
				if(!obj){
					return false;
				}
				var func = target["toData_" + typeVal];
				if(func){
					func.call(configure,el,obj);
				}
				return obj;
			};
			exec.toEl = function(obj,configure){
				var target = exec.options;
				target.toEl && target.toEl.call(configure,obj,core);
			};
			exec.options = options;
		}
		return Configure;
	};
	Configure.getDefaultAttr = function(name){
		return core[name].options.defaultAttr;
	};
	extend("line",{
		defaultAttr : {
			_len : 150,
			_dasharray : '- ',
			_attr : {
				"stroke" : "#888",
				"stroke-width" : 5,
				"stroke-linecap" : "round",
				"cursor" : "pointer"
			},
			_outerAttr : {
				"stroke" : "#d2d2d2",
				"stroke-width" : 15,
				"stroke-linecap" : "round",
				"cursor" : "pointer"
			},
			_innerAttr : {
				"stroke" : "blue",
				"stroke-dasharray" : "-"
			}
		},
		init : function(str){
			return this.path(str);
		},
		dotted : function(path,attrParams){
			if(!attrParams.attr || !attrParams.attr["stroke-dasharray"]){
				path.attr("stroke-dasharray",attrParams._dasharray);
			}
		}
	});
	(function(){
		function init(src,x,y,w,h){
			return this.image(src,x,y,w,h);
		}
		extend("connector",{
			init : init
		});
		extend("device",{
			init : init
		});
	})();
	return Configure;
});