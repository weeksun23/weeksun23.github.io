require(['data'],function(data){
	var vmodel = avalon.define("weeksun",function(vm){
		vm.curPage = '';
		vm.windowHtml = "";
		vm.windowSrc = "";
		vm.isMenuShow = false;
		vm.isWindowOpen = false;
		vm.isMenuAnimateHide = false;
		vm.labList = data;
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
});
