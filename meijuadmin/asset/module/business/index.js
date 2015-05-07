require(["common/mmAnimate",'common/accordion/avalon.accordion'],function(){
	var top = avalon.define({
		$id : "top",
		navCollapse : true,
		$toggleNav : function(){
			top.navCollapse = !top.navCollapse;
		}
	});
	var content = avalon.define({
		$id : 'content',
		$leftmenuOpts : {
			data : [{
				title : "用户管理",iconCls : "glyphicon-user",
				children : [{
					text : "用户信息",iconCls : "glyphicon-list-alt",selected : true
				}]
			},{
				title : "家庭管理",iconCls : "glyphicon-home",
				children : [{
					text : "家庭列表",iconCls : "glyphicon-list-alt"
				}]
			},{
				title : "家电管理",iconCls : "glyphicon-blackboard",
				children : [{
					text : "家电列表",iconCls : "glyphicon-list-alt"
				},{
					text : "家电类型",iconCls : "glyphicon-link"
				},{
					text : "家电型号",iconCls : "glyphicon-phone"
				}]
			},{
				title : "升级包管理",iconCls : "glyphicon-cloud-upload",
				children : [{
					text : "app升级包",iconCls : "glyphicon-level-up"
				},{
					text : "wifi模块升级包",iconCls : "glyphicon-open-file"
				}]
			},{
				title : "系统日志",iconCls : "glyphicon-calendar",
				children : [{
					text : "app日志列表",iconCls : "glyphicon-calendar"
				},{
					text : "家电通信日志列表",iconCls : "glyphicon-calendar"
				},{
					text : "流程日志查询",iconCls : "glyphicon-calendar"
				},{
					text : "应用服务器日志",iconCls : "glyphicon-calendar"
				},{
					text : "第三方平台日志",iconCls : "glyphicon-calendar"
				},{
					text : "调用平台日志",iconCls : "glyphicon-calendar"
				},{
					text : "推送日志",iconCls : "glyphicon-calendar"
				}]
			},{
				title : "应用服务器",iconCls : "glyphicon-hdd",
				children : [{
					text : "应用服务器管理",iconCls : "glyphicon-tasks"
				},{
					text : "管家系统管理",iconCls : "glyphicon-tasks"
				}]
			}]
		}
	});
	avalon.scan();
});