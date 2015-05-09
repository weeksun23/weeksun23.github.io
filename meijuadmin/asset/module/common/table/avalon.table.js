define(["avalon","text!./avalon.table.html","css!./avalon.table.css"],function(avalon,templete){
	var widget = avalon.ui.table = function(element, data, vmodels){
		var options = data.tableOptions;
		var vmodel = avalon.define(data.tableId,function(vm){
			avalon.mix(vm,options);
			vm.widgetElement = element;
			vm.$skipArray = ['widgetElement','pageSizeArr'];
			vm.$init = function(){
				avalon(element).addClass("panel panel-default");
				element.innerHTML = templete;
				avalon.scan(element, vmodel);
				if (typeof options.onInit === "function") {
					options.onInit.call(element, vmodel, options, vmodels);
				}
				updatePagination(vmodel.data.total);
			};
			vm.$remove = function(){
				element.innerHTML = element.textContent = ""
			};
			vm.$toPage = function(){

			};
			vm.$changePageSize = function(){
				updatePagination(vmodel.data.total);
			};
			vm.$prePage = function(){
				if(avalon(this).hasClass("disabled")) return;
				vmodel.changeCurPage = --vmodel.curPage;
				updatePagination(vmodel.data.total);
			};
			vm.$nextPage = function(){
				if(avalon(this).hasClass("disabled")) return;
				vmodel.changeCurPage = ++vmodel.curPage;
				updatePagination(vmodel.data.total);
			};
		});
		function updatePagination(total){
			if(total === 0){
				avalon.each(['sumPage','total','curPage','start','end'],function(i,v){
					vmodel[v] = 0;
				});
			}else{
				vmodel.sumPage = parseInt(total / vmodel.pageSize,10) + (total % vmodel.pageSize > 0 ? 1 : 0);
				if(vmodel.curPage === 0){
					vmodel.changeCurPage = vmodel.curPage = 1;
				}else if(vmodel.curPage > vmodel.sumPage){
					vmodel.changeCurPage = vmodel.curPage = vmodel.sumPage;
				}
				vmodel.start = 1 + vmodel.pageSize * (vmodel.curPage - 1);
				if(vmodel.start + vmodel.pageSize > total){
					vmodel.end = total;
				}else{
					vmodel.end = vmodel.start + vmodel.pageSize - 1;
				}
			}
		}
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
		//table标题
		title : null,
		striped : true,
		border : true,
		/*
		title:标题,field:字段名
		*/
		columns : [],
		data : {
			total : 0,
			rows : []
		},
		//pagination options
		pagination : true,
		sumPage : 0,
		total : 0,
		curPage : 0,
		changeCurPage : 1,
		start : 0,
		end : 0,
		pageSize : 5,
		pageSizeArr : [5,20,30,40]
	};
});