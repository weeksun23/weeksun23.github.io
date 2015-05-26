require(["common/index","common/tooltip/avalon.tooltip"],function(Index){
	Index.top.curIndex = 0;
	Index.body.curPage = "content";
	var content = avalon.define({
		$id : "content",
		showCarlist : function(){
			Index.body.curPage = "carlist";
			this._tooltipVM.remove();
		}
	});
	var carlist = avalon.define({
		$id : "carlist",
		back : function(){
			Index.body.curPage = 'content';
		},
		list : [{
			src : "image/plate.jpg"
		},{
			src : "image/plate.jpg"
		},{
			src : "image/plate.jpg"
		},{
			src : "image/plate.jpg"
		},{
			src : "image/plate.jpg"
		}]
	});
	avalon.scan();
});