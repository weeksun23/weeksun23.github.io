(function(){
	var top = avalon.define({
		$id : "top",
		navCollapse : true,
		toggleNav : function(){
			top.navCollapse = !top.navCollapse;
		}
	});
	var content = avalon.define({
		$id : "content"
	});
})();