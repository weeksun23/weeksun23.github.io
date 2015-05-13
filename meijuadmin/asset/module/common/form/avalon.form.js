define(["avalon","text!./avalon.form.html"],function(avalon,templete){
	var tpls = templete.split("MS_SPLIT");
	function replace(tpl,obj){
		for(var i in obj){
			var reg = new RegExp("\\$\\{" + i + "\\}","g");
			var val = obj[i];
			if(val === undefined || val === null){
				val = "";
			}
			tpl = tpl.replace(reg,val);
		}
		return tpl;
	}
	function getSelectOptions(data){
		var html = [];
		var tpl = "<option value='${value}'>${text}</option>"
		for(var i=0,item;item=data[i++];){
			html.push(replace(tpl,item));
		}
		return html.join("");
	}
	function getItemHtml(tpl,obj,colsnum){
		var type = obj.type || 'text';
		var valid = obj.valid;
		if(valid){
			if (colsnum === 1) {
				valid.sm = 10;
				valid.offset = 2;
			}else if(colsnum === 2){
				valid.sm = 8;
				valid.offset = 4;
			}
			var validStr = replace(tpls[4],valid);
		}
		if(type === "text"){
			var content = replace(tpls[2],{
				id : obj.id ? ("id='"+obj.id+"'") : "",
				field : obj.field,
				valid : validStr
			});
		}else if(type === "select"){
			content = replace(tpls[3],{
				id : obj.id ? ("id='"+obj.id+"'") : "",
				field : obj.field,
				options : typeof obj.selectOptions == 'string' ? obj.selectOptions : getSelectOptions(obj.selectOptions),
				valid : validStr
			});
		}
		return replace(tpl,{
			content : content,
			text : obj.text,
			forTxt : obj.id ? ("for='"+obj.id+"'") : ""
		});
	}
	var widget = avalon.ui.form = function(element, data, vmodels){
		var options = data.formOptions;
		var html = ["<fieldset>"];
		avalon.each(options.data,function(i,item){
			html.push("<div class='form-group'>");
			var len = item.length;
			if(len === 1){
				html.push(getItemHtml(tpls[0],item[0],len));
			}else if(len === 2){
				html.push(getItemHtml(tpls[1],item[0],len));
				html.push(getItemHtml(tpls[1],item[1],len));
			}
			html.push("</div>");
		});
		html.push("</fieldset>");
		element.innerHTML = html.join("");
		var vmodel = avalon.define(data.formId,function(vm){
			avalon.mix(vm,options);
			vm.$skipArray = ['data'];
			vm.$init = function(){
				avalon(element).addClass("form-horizontal");
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
		/*
		[[{
			field : 字段名，对应model中的键值,
			text : label文字,
			type : 类型，目前支持 text select,
			selectOptions : 用于select生成option的数据,
			id : dom id用于label for属性,
			valid : {
				field : 字段名，对应vmodel中的键值,
				messageField : 字段名，对应vmodel中的键值,
			}
		}],[{},{}]]
		*/
		data : [],
		model : {}
	};
});