var express = require('express');
var request = require('request');
app.get('/getContent', function(req, res) {
	request("");
});



var _data = [];
$("div.trendCont_box tbody tr").each(function(){
	_data.push({
		time : $(this).find("th:eq(0)").text(),
		content : $(this).find("th:eq(1)").text()
	});
});
(function(){
	//万 千 百 十 个
	// var analyseData = [];
	// for(var i=0;i<5;i++){
	// 	analyseData.push({
	// 		zeroNum : 0,
	// 		danNum : 0,
	// 		shuangNum : 0
	// 	});
	// }
	var arr = ['','','','',''];
	var text = ["万","千","百","十","个"];
	for(var i=0,ii=_data.length;i<ii;i++){
		var item = _data[i];
		var content = item.content;
		for(var j=0,jj=content.length;j<jj;j++){
			var ch = content.charAt(j);
			arr[j] += ch;
			// if(num[j] === 2){
			// 	if(+ch % 2){

			// 	}
			// }
		}
	}
	console.log(_data[0].time + "~" + _data[ii - 1].time);
	for(var i=0;i<5;i++){
		var arr00 = arr[i].split("00");
		if(arr00.length === 0){
			console.log(text[i] + "位没试过连出两个0");
		}else{
			var shuang = 0,
				dan = 0;
			for(var j=1,jj=arr00.length;j<jj;j++){
				if(arr00[j] === ''){
					shuang++
				}else{
					if(+arr00[j].charAt(0) % 2 === 0){
						shuang++;
					}else{
						dan++;
					}
				}
			}
			console.log(text[i] + "位试过" + (arr00.length - 1) + "次连出两个0,紧跟后一位单的数量为" + dan + "，双的数量为" + shuang);
		}
	}
})();
/*[{
	time : "17-002",
	content : '03112'
}]*/
// console.log(_data);