require(['common/mmRouter','common/accordion/avalon.accordion','common/tab/avalon.tab','common/dialog/avalon.dialog'],function(){
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
					text : "用户信息",iconCls : "glyphicon-list-alt",url : "usermanage/userinfo.html"
				}]
			},{
				title : "家庭管理",iconCls : "glyphicon-home",
				children : [{
					text : "家庭列表",iconCls : "glyphicon-list-alt",url : "homemanage/homelist.html"
				}]
			},{
				title : "家电管理",iconCls : "glyphicon-blackboard",
				children : [{
					text : "家电列表",iconCls : "glyphicon-list-alt",url : "elecmanage/eleclist.html"
				},{
					text : "家电类型",iconCls : "glyphicon-link",url : "elecmanage/electype.html"
				},{
					text : "家电型号",iconCls : "glyphicon-phone",url : 'elecmanage/elecmodel.html'
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
			}],
			onInit : function(){
				initFirstPage();
			},
			onSelectItem : function(ch){
				var $tab = avalon.vmodels.$contenttab;
				var panel = $tab.getTab(ch.text);
				if(panel){
					$tab.curIndex = panel.index;
				}else{
					if(ch.url){
						var name = ch.url.replace(/\..*$/g,'');
						location.href = '#!/' + name;
					}else{
						$tab.add({
							selected : true,
							header : {
								title : ch.text,
								iconCls : ch.iconCls,
								closeable : true
							},
							content : {
								html : '<h1>'+ch.text+'正在研发中...</h1>'
							}
						});
					}
				}
			}
		},
		$contenttabOpts : {
			onInit : function(){
				initFirstPage();
			},
			onSelect : function(header,content){
				if(avalon.vmodels.$leftmenu){
					var item = avalon.vmodels.$leftmenu.selectItemByText(header.title);
					if(!item.url) return;
					var name = item.url.replace(/\..*$/g,'');
					location.href = '#!/' + name;
				}
			},
			onClose : function(vmodel){
				if (vmodel.curIndex === -1) {
					var item = avalon.vmodels.$leftmenu.getSelectedItem();
					if(item){
						item.selected = false;
						//avalon.router.navigate("/usermanage/userinfo");
					}
				}
			}
		}
	});
	function initFirstPage(){
		if(++initFirstPage.flag === 2){
			var $leftmenu = avalon.vmodels.$leftmenu;
			$leftmenu.curIndex = 0;
			$leftmenu.selectItem($leftmenu.data[0].children[0]);
		}
	}
	initFirstPage.flag = 0;
	avalon.scan();
	//路由管理
	(function(){
		var obj = {
			"/usermanage/userinfo" : 1,
			"/homemanage/homelist" : 1,
			"/elecmanage/eleclist" : 1,
			"/elecmanage/electype" : 1,
			"/elecmanage/elecmodel" : 1
		};
		function callback(){
			if(obj[this.path]){
				var path = this.path.substring(1) + ".html";
				var ch;
				avalon.each(avalon.vmodels.$leftmenu.data,function(i,v){
					var children = v.children;
					if(children && children.length){
						for(var i=0,item;item=children[i++];){
							if(item.url === path){
								ch = item;
								return false;
							}
						}
					}
				});
				if(ch){
					var $tab = avalon.vmodels.$contenttab;
					var panel = $tab.getTab(ch.text);
					if(panel){
						$tab.curIndex = panel.index;
						return;
					}
					avalon.vmodels.$contenttab.add({
						selected : true,
						header : {
							title : ch.text,
							iconCls : ch.iconCls,
							closeable : true
						},
						content : {
							html : '<iframe class="w100" src="'+path+'" name="'+path.replace(/[\/\.]/g,'-')
								+'" scrolling="no" frameborder="0"></iframe>'
						}
					});
				}
			}else{
				avalon.router.navigate("/usermanage/userinfo");
			}
		}
		avalon.history.start({
			basepath : "/meijuadmin/asset/html/"
		});
		avalon.each(obj,function(i,v){
			avalon.router.get(i,callback);
		});
	})();
	avalon.router.navigate("/usermanage/userinfo");
	(function(){
		//定时轮询 resize 选中的iframe 
		var $leftmenu = avalon.vmodels.$leftmenu;
		var el = avalon.vmodels.$contenttab.widgetElement;
		setInterval(function(){
			var item = $leftmenu.getSelectedItem();
			if(item && item.url){
				var name = item.url.replace(/[\/\.]/g,'-');
				avalon.each(el.getElementsByTagName("iframe"),function(i,iframe){
					if(iframe.name === name){
						try{
							iframe.height = avalon(iframe.contentWindow.document.body).height();
						}catch(ex){}
						return false;
					}
				});
			}
		},200);
	})();
});