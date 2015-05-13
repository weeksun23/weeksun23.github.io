require(['common/accordion/avalon.accordion','common/tab/avalon.tab','common/dialog/avalon.dialog'],function(){
	//左侧菜单栏数据
	var menuData = [{
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
	}];
	//将url转换成hash字符串
	function url2Hash(url){
		return "#" + url.replace(/\..*$/g,'');
	}
	//路由管理
	var Route = (function(){
		var urlObj = (function(){
			var re = {};
			avalon.each(menuData,function(i,v){
				avalon.each(v.children,function(j,ch){
					if(ch.url){
						re[url2Hash(ch.url)] = ch;
					}
				});
			});
			return re;
		})();
		function callback(hash){
			var ch = urlObj[hash];
			if(ch){
				var $tab = avalon.vmodels.$contenttab;
				var panel = $tab.getTab(ch.text);
				if(panel){
					//如果panel已存在 则选中它
					$tab.curIndex = panel.index;
					return;
				}
				//不存在 则生成
				avalon.vmodels.$contenttab.add({
					selected : true,
					header : {
						title : ch.text,
						iconCls : ch.iconCls,
						closeable : true
					},
					content : {
						html : '<iframe class="w100" src="' + ch.url + '" name="' + ch.url.replace(/[\/\.]/g,'-')
							+ '" scrolling="no" frameborder="0"></iframe>'
					}
				});
			}
		}
		window.onhashchange = function(){
			callback(location.hash);
		};
		return {
			changeHash : function(hash){
				var oldHash = location.hash;
				if(hash === oldHash){
					callback(oldHash);
				}else{
					location.hash = hash;
				}
			},
			firstPage : "#usermanage/userinfo"
		};
	})();
	//顶部vmodel
	var top = avalon.define({
		$id : "top",
		navCollapse : true,
		$toggleNav : function(){
			top.navCollapse = !top.navCollapse;
		}
	});
	//内容vmodel
	var content = avalon.define({
		$id : 'content',
		$leftmenuOpts : {
			data : menuData,
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
						Route.changeHash(url2Hash(ch.url));
					}
				}
			}
		},
		$contenttabOpts : {
			noContentTip : "请点击左边菜单",
			onInit : function(){
				initFirstPage();
			},
			onSelect : function(header,content){
				if(avalon.vmodels.$leftmenu){
					var item = avalon.vmodels.$leftmenu.selectItemByText(header.title);
					if(!item.url) return;
					Route.changeHash(url2Hash(item.url));
				}
			},
			onClose : function(vmodel){
				if (vmodel.curIndex === -1) {
					var item = avalon.vmodels.$leftmenu.getSelectedItem();
					if(item){
						item.selected = false;
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