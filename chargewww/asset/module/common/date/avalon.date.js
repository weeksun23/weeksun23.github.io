define(['avalon',"text!./avalon.date.html","css!./avalon.date.css"],function(avalon,tpl){
	function getNum(s,n){
		var re = [];
		for(var i = s;i <= n;i++){
			re.push(i);
		}
		return re;
	}
	function setDateItemsVal(vmodel,date){
		avalon.mix(vmodel,{
			year : date.getFullYear(),
			month : date.getMonth() + 1,
			day : date.getDate(),
			hour : date.getHours(),
			minute : date.getMinutes(),
			second : date.getSeconds()
		});
	}
	var widget = avalon.ui.date = function(element, data, vmodels){
		var options = data.dateOptions;
		var date = new Date();
		avalon.mix(options,{
			years : getNum(date.getFullYear() - 5,date.getFullYear() + 5),
			months : getNum(1,12),
			days : getNum(1,31),
			hours : getNum(0,23),
			minutes : getNum(0,59),
			seconds : getNum(0,59),
			value : avalon.filters.date(date,"yyyy-MM-dd HH:mm:ss")
		});
		setDateItemsVal(options,date);
		var vmodel = avalon.define(data.dateId,function(vm){
			avalon.mix(vm,options);
			vm.$skipArray = [];
			vm.$init = function(){
				avalon(element).addClass("input-group mdate");
				element.innerHTML = tpl;
				avalon.scan(element,vmodel);
			};
			vm.setValue = function(v){
				if(typeof v == 'string'){
					v = new Date(v);
				}
				setDateItemsVal(vmodel,v);
			};
		});
		avalon.each(["year",'month','day','hour','minute','second'],function(i,v){
			vmodel.$watch(v,function(){
				vmodel.value = avalon.filters.date(
					new Date(vmodel.year,vmodel.month - 1,vmodel.day,vmodel.hour,vmodel.minute,vmodel.second),
					"yyyy-MM-dd HH:mm:ss");
				avalon.log(vmodel.value);
			});
		});
		return vmodel;
	};
	widget.defaults = {
	};
});