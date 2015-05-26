require.config({
	paths: {
		jquery : "lib/jquery/jquery-2.1.4"
	}
});
define(function(){
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
		$id : "body"
	});
	var top = avalon.define({
		$id : "top",
		navCollapse : true,
		curIndex : -1,
		toggleNav : function(){
			top.navCollapse = !top.navCollapse;
		}
	});
	return {
		top : top
	};
});