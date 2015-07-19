(function(){
	var vmodel = avalon.define("weeksun",function(vm){
		vm.curPage = '';
		vm.windowHtml = "";
		vm.windowSrc = "";
		vm.isMenuShow = false;
		vm.isWindowOpen = false;
		vm.isMenuAnimateHide = false;
		vm.labList = [{
			title : 'jQuery',
			children : [{
				href : "jscroll/index.html",title : "jscroll",date : "2015-05-01",
				desc : "jquery自定义滚动条插件,完善中..."
			}]
		},{
			title : 'avalon',
			children : [{
				href : "YuriUI/demo/index.html",title : "Yuri ui",date : "2014-11-21",
				desc : "基于avalon的ui库"
			},{
				href : "AvalonBootstrap",title : "AvalonBootstrap",date : "2015-07-19",
				desc : "用avalon做的一些bootstrap组件"
			}]
		},{
			title : 'avalon.mobile',
			children : [{
				href : "AMUI/demo/pick.html",title : "pick",date : "2015-04-28",desc : "滑动选择插件"
			},{
				href : "AMUI/demo/dialog.html",title : "dialog",date : "2015-04-28",desc : "对话框"
			},{
				href : "AMUI/demo/slideitem.html",title : "slideitem",date : "2015-04-28",desc : "滑动列表"
			},{
				href : "AMUI/demo/slidemenu.html",title : "slidemenu",date : "2015-04-28",
				desc : "侧边滑动菜单"
			}]
		},{
			title : 'html5',
			children : [{
				href : "Clock/clock.html",title : "Clock",date : "2015-02-06",desc : "css3+js的计时时钟"
			}]
		}];
		vm.$onClickMask = function(){
			vmodel.isWindowOpen = false;
		};
		vm.$onTitleClick = function(src){
			vmodel.windowSrc = src;
			if(vmodel.windowHtml === ""){
				vmodel.windowHtml = 
					"<iframe ms-src='{{windowSrc}}' scrolling='no' frameborder='0' name='weeksun'></iframe>";
			}
			vmodel.isWindowOpen = true;
		};
		vm.$onClickNav = function(e){
			var target = e.target;
			var tagName = target.tagName;
			if(tagName && tagName.toLowerCase() === 'a'){
				var type = target.getAttribute("data-type");
				if(type){
					location.hash = type;
				}
			}
		};
		vm.$toggleMenu = function(){
			if(vmodel.isMenuShow){
				vmodel.isMenuAnimateHide = true;
			}else{
				vmodel.isMenuShow = true;
			}
		};
		vm.$animationend = function(){
			if(vmodel.isMenuAnimateHide){
				vmodel.isMenuShow = false;
				vmodel.isMenuAnimateHide = false;
			}
		};
	});
	(function(){
		function isNoNeedHide(target){
			target = avalon(target);
			return target.hasClass("bar-nav") || target.hasClass('bar-toggle');
		}
		avalon.bind(document.body,'mousedown',function(e){
			if(vmodel.isMenuShow){
				var target = e.target;
				if(target && target.tagName){
					if(isNoNeedHide(target)) return;
					var pNode = target.parentNode;
					while(pNode){
						if(isNoNeedHide(pNode)) return;
						pNode = pNode.parentNode;
					}
					vmodel.isMenuAnimateHide = true;
				}
			}
		});
	})();
	(function(){
		var obj = {
			"#lab" : 1,
			"#log" : 1,
			"#about" : 1
		};
		function dealHash(){
			if(obj[location.hash]){
				vmodel.curPage = location.hash.substring(1);
			}else{
				location.hash = "lab";
			}
		}
		window.onhashchange = dealHash;
		dealHash();
	})();
})();