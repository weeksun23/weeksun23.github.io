require(["common/index"],function(Index){
	Index.top.curIndex = 0;
	var content = avalon.define({
		$id : "content"
	});
	avalon.scan();
});