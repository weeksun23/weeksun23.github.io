require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
define(["common/dialog/avalon.dialog"],function(){
	avalon.support = {
		transitionend : (function(){
			var el = document.createElement('div');
			var transEndEventNames = {
				WebkitTransition: 'webkitTransitionEnd',
				MozTransition: 'transitionend',
				OTransition: 'oTransitionEnd otransitionend',
				transition: 'transitionend'
			};
			for (var name in transEndEventNames) {
				if (el.style[name] !== undefined) {
					return transEndEventNames[name];
				}
			}
			return false;
		})()
	};
	var body = avalon.define({
		$id : "body",
		curPage : null,
		$personalWinOpts : {
			title : "个人信息"
		}
	});
	var top = avalon.define({
		$id : "top",
		navCollapse : true,
		curIndex : -1,
		toggleNav : function(){
			top.navCollapse = !top.navCollapse;
		},
		showPersonalWin : function(){
			avalon.vmodels.$personalWin.open();
		}
	});
	return {
		top : top,
		body : body
	};
});