define(["avalon","text!./avalon.tab.html"],function(avalon,templete){
	var widget = avalon.ui.tab = function(element, data, vmodels){
		var options = data.tabOptions;
		var children = element.children;
		if(children.length > 0){
			var headerData = options.headerData = [];
			var contentData = options.contentData = [];
			avalon.each(children,function(i,v){
				headerData.push({
					title : v.title
				});
				contentData.push({
					content : v.innerHTML
				});
			});
		}
		var vmodel = avalon.define(data.tabId,function(vm){
			avalon.mix(vm,options);
			vm.widgetElement = element;
			vm.$skipArray = ['widgetElement'];
			vm.$init = function(){
				element.innerHTML = templete;
				avalon.scan(element, vmodel);
			};
			vm.$remove = function(){
				element.innerHTML = element.textContent = "";
			};
			vm.$clickHeader = function(i){
				vmodel.curIndex = i;
			};
		});
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
		headerData : [],
		contentData : [],
		curIndex : 0
	};
});