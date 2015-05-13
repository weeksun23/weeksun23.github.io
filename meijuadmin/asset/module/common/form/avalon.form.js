define(["avalon","text!./avalon.form.html"],function(avalon,templete){
	var widget = avalon.ui.form = function(element, data, vmodels){
		var options = data.formOptions;
		var vmodel = avalon.define(data.formId,function(vm){
			avalon.mix(vm,options);
			vm.$skipArray = [];
			vm.$init = function(){
				avalon(element).addClass("form-horizontal");
				element.innerHTML = templete;
				avalon.scan(element, vmodel);
				vmodel.onInit && vmodel.onInit.call(element, vmodel, vmodels);
			};
			vm.$remove = function(){
				element.innerHTML = element.textContent = "";
			};
		});
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
		data : []
	};
});