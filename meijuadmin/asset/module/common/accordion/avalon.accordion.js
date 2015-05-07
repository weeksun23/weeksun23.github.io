//mmAnimate
define(["avalon","text!./avalon.accordion.html","css!./avalon.accordion.css"],function(avalon,templete){
	var widget = avalon.ui.accordion = function(element, data, vmodels){
		var options = data.accordionOptions;
		var children = element.children;
		if(children.length > 0){
			options.data = (function(){
				var accordionData = [];
				avalon.each(children,function(i,v){
					var obj = {
						title : v.title,
						content : v.innerHTML
					};
					avalon.each(['iconCls'],function(i,key){
						obj[key] = v.getAttribute("data-" + key);
					});
					accordionData.push(obj);
				});
				return accordionData;
			})();
		}else{
			options.data = (function(){
				var accordionData = [];
				avalon.each(options.data,function(i,v){
					var obj = avalon.mix({
						title : null,
						content : null,
						iconCls : null,
						children : null
					},v);
					if(obj.children && obj.children.length){
						//只允许一个select
						var hasSel = false;
						avalon.each(obj.children,function(j,v){
							if(hasSel){
								v.selected = false;
								return;
							}
							if(v.selected){
								hasSel = true;
							}else if(v.selected === undefined){
								v.selected = false;
							}
						});
					}
					accordionData.push(obj);
				});
				return accordionData;
			})();
		}
		function togglePanel(i,action){
			var target = element.children[i].children[1];
			target.style.display = 'block';
			var inner = target.children[0];
			var h = avalon(inner).height();
			if(action === 'slideDown'){
				inner.style.height = 0;
				avalon(inner).animate({
					height : h
				},200,function(){
					this.style.height = 'auto';
				});
			}else{
				inner.style.height = h;
				avalon(inner).animate({
					height : 0
				},200,function(){
					this.style.height = 'auto';
					target.style.display = 'none';
				});
			}
		}
		var vmodel = avalon.define(data.accordionId,function(vm){
			avalon.mix(vm,options);
			vm.$skipArray = [];
			vm.$init = function(){
				avalon(element).addClass("panel-group maccordion");
				element.innerHTML = templete;
				avalon.scan(element, vmodel);
				vmodel.curIndex = 0;
			};
			vm.$remove = function(){
				element.innerHTML = element.textContent = "";
			};
			vm.$clickHeader = function(i){
				if(i === vmodel.curIndex){
					vmodel.curIndex = -1;
				}else{
					vmodel.curIndex = i;
				}
			};
			vm.$selectItem = function(ch){
				if(ch.selected) return;
				avalon.each(vmodel.data,function(i,v){
					for(var j=0,jj;jj=v.children[j++];){
						if(jj.selected){
							jj.selected = false;
							return false;
						}
					}
				});
				ch.selected = true;
			};
		});
		vmodel.$watch("curIndex",function(newVal,oldVal){
			if(newVal === -1){
				return togglePanel(oldVal,'slideUp');
			}
			if(oldVal === -1){
				return togglePanel(newVal,'slideDown');
			}
			togglePanel(oldVal,'slideUp');
			togglePanel(newVal,'slideDown');
		});
		return vmodel;
	};
	widget.version = 1.0;
	widget.defaults = {
		curIndex : -1,
		data : []
	};
});