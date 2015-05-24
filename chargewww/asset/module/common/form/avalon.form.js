define(["avalon","text!./avalon.form.html"],function(avalon,templete){
	var tpls = templete.split("MS_SPLIT");
	function replace(tpl,obj){
		if(!obj) return tpl;
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
	function getAttrStr(attr,val){
		return val ? (attr + "='"+val+"'") : "";
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
			var validCls = "ms-class='has-error:"+valid.condition+"'";
		}
		if(type === "text"){
			var content = replace(tpls[2],{
				id : getAttrStr("id",obj.id),
				field : obj.field
			});
		}else if(type === "select"){
			var selectOptions = obj.options.selectOptions;
			content = replace(tpls[3],{
				id : getAttrStr("id",obj.id),
				field : obj.field,
				options : typeof selectOptions == 'string' ? selectOptions : getSelectOptions(selectOptions)
			});
		}else if(type === 'date'){
			content = replace(tpls[5],{
				id : getAttrStr("id",obj.id),
				field : obj.field,
				datePickerId : getAttrStr("id",obj.options.datePickerId)
			});
		}else if(type === "dom"){
			content = replace(document.getElementById(obj.domId).innerHTML,obj.options);
		}
		return replace(tpl,{
			content : content,
			text : obj.text,
			forTxt : getAttrStr("for",obj.id),
			valid : validStr,
			validCls : validCls
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
			type : 类型，目前支持 text select date dom,
			domId : dom类型的模板dom id,
			options : {//其它配置
				selectOptions : 用于select生成option的数据,
				datePickerId : datePickerId
			},
			id : dom id用于label for属性,
			valid : {
				condition : 验证条件,
				messageField : 字段名，对应vmodel中的键值,
			}
		}],[{},{}]]
		*/
		data : [],
		model : {}
	};
});