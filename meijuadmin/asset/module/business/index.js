(function(){
	var vmodel = avalon.define({
		$id : "top",
		navCollapse : true,
		$toggleNav : function(){
			vmodel.navCollapse = !vmodel.navCollapse;
		}
	});
})();
