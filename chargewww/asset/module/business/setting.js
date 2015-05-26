require([
	"common/index",
	"common/table/avalon.table"
],function(Index){
	Index.top.curIndex = 3;
	var content = avalon.define({
		$id : "content",
		$userTbOpts : {
			title : "VIP用户列表",
			columns : [
				{title : "姓名",field : "name"},
				{title : "类型",field : "type"},
				{title : "车牌号码",field : "carnum"},
				{title : "有效期",field : "date"},
				{title : "安保",field : "ser"}
			],
			frontPageData : [
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'},
				{name : "234534",carnum : "粤XHN161",date : '2013-44-33 34:44:44'}
			]
		}
	});
	avalon.scan();
});