define(["avalon","text!./avalon.table.html","css!./avalon.table.css"],function(avalon,templete){
	var widget = avalon.ui.table = function(element, data, vmodels){
		var options = data.tableOptions;
		initFrontPageData(options);
		var vmodel = avalon.define(data.tableId,function(vm){
			avalon.mix(vm,options);
			vm.widgetElement = element;
			vm.$skipArray = ['widgetElement','loadData','frontPageData'];
			vm.$init = function(){
				avalon(element).addClass("panel panel-default panel-table");
				element.innerHTML = templete;
				avalon.scan(element, vmodel);
				if (typeof options.onInit === "function") {
					options.onInit.call(element, vmodel, options, vmodels);
				}
				updatePagination();
			};
			vm.$toThePage = function(e){
				if(e.keyCode === 13){
					loadDataByPage(vmodel.changeCurPage || 1);
				}
			}
			vm.$remove = function(){
				element.innerHTML = element.textContent = ""
			};
			vm.$changePageSize = function(){
				loadDataByPage(vmodel.curPage);
			};
			vm.$toPage = function(p){
				if(avalon(this).hasClass("disabled")) return;
				if(typeof p == 'number'){
					var page = vmodel.curPage + p;
				}else if(p == 'first'){
					page = 1;
				}else if(p == 'last'){
					page = vmodel.sumPage;
				}
				loadDataByPage(page);
			};
			vm.loadFrontPageData = function(data){
				vmodel.frontPageData = data;
				vmodel.total = data.length;
				loadDataByPage(1);
			};
		});
		function loadDataByPage(page,func){
			if(!vmodel.url){
				if(!vmodel.frontPageData){
					avalon.error("若不定义url，则请将数据源赋值给frontPageData属性");
				}
				vmodel.curPage = vmodel.changeCurPage = page;
				updatePagination();
				var start = (page - 1) * vmodel.pageSize;
				var total = vmodel.total;
				if(start >= total){
					start = (vmodel.sumPage - 1) * vmodel.pageSize;
				}
				var end = start + vmodel.pageSize;
				var re = [];
				for(;start < end;start++){
					var item = vmodel.frontPageData[start];
					if(!item) break;
					re.push(item);
				}
				vmodel.data = re;
				func && func();
			}
		}
		//初始化前台分页数据
		function initFrontPageData(opts){
			if(opts.url) return;
			var frontPageData = opts.frontPageData;
			if(!frontPageData || frontPageData.length === 0) return;
			var re = [];
			for(var i=0;i<opts.pageSize;i++){
				var item = frontPageData[i];
				if(!item) break;
				re.push(item);
			}
			opts.total = frontPageData.length;
			opts.data = re;
		}
		//更新分页信息
		function updatePagination(){
			var total = vmodel.total;
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
	//url frontPageData
	widget.defaults = {
		//table标题
		title : null,
		striped : true,
		border : true,
		url : null,
		/*
		title:标题,field:字段名
		*/
		columns : [],
		frontPageData : [],
		total : 0,
		data : [],
		//pagination options
		pagination : true,
		sumPage : 0,
		curPage : 0,
		changeCurPage : 1,
		start : 0,
		end : 0,
		pageSize : 5,
		pageSizeArr : [5,20,30,40]
	};
});