define(function(){
	"use strict";
	function isElExist(els,el){
		for(var i=0,item;item=els[i++];){
			var connectedEls = item.connectedEls;
			for(var j=0,jItem;jItem=connectedEls[j++];){
				if(el.id === jItem.id) return true;
			}
		}
		return false;
	}
	function Choose(configure){
		function restoreDrawRect(){
			var matchSet = drawRect.hide().attr("cursor","auto").data("matchSet");
			if(matchSet){
				matchSet.forEach(function(el){
					el.connectedEls = null;
				});
				drawRect.removeData("matchSet");
			}
			hasMove = false;
			isChoosedState = false;
		}
		var paper = configure.paper;
		//是否框选过的标志
		var hasMove = false;
		//是否处于已框选状态
		var isChoosedState = false;
		var drawRect = paper.rect(0,0,0,0,0).hide().drag(function(dx,dy){
			if(dx === 0 && dy === 0) return;
			this.attr({
				x : this.sX + dx,
				y : this.sY + dy
			});
			var path = this.closeIcon;
			path.transform("t" + [path.sX + dx,path.sY + dy].join(','));
			var matchSet = this.data("matchSet");
			matchSet.forEach(function(el){
				configure.connect.move(el,dx,dy);
			});
		},function(){
			this.sX = this.attr('x');
			this.sY = this.attr('y');
			var path = this.closeIcon;
			var bbox = this.getBBox();
			path.sX = bbox.x2;
			path.sY = bbox.y;
			var matchSet = this.data("matchSet");
			matchSet.forEach(function(el){
				configure.connect.setStartXStartY(el.connectedEls);
			});
		}).attr({
			stroke : 'blue',
			fill : "#d2d2d2",
			"fill-opacity" : 0.3,
			"stroke-dasharray" : "- "
		}).data("drawRect",true);
		//置于最底部的rect，用于触发生成框选rect
		var underRect = paper.rect(0,0,configure.paperW,configure.paperH,0).drag(function(dx,dy){
			if(isChoosedState) return;
			if(dx === 0 && dy === 0) return;
			hasMove = true;
			drawRect.attr({
				width : dx < 0 ? 0 : dx,
				height : dy < 0 ? 0 : dy
			});
		},function(x,y,e){
			if(isChoosedState) return;
			hasMove = false;
			drawRect.show().attr({
				x : e.offsetX,
				y : e.offsetY,
				width : 0,
				height : 0
			});
		},function(){
			var me = this;
			if(isChoosedState) return;
			if(hasMove){
				hasMove = false;
				var drawRectBBox = drawRect.toFront().getBBox();
				var matchSet = paper.set();
				paper.forEach(function(el){
					var elId = el.id,
						elType = el.type;
					//目前只有image元素才能被框选到
					if(elId !== drawRect.id && elId !== me.id 
							&& elType === "image"
							&& Raphael.isBBoxIntersect(drawRectBBox, el.getBBox())){
						if(!isElExist(matchSet,el)){
							configure.connect.getConnectedEls(el);
							matchSet.push(el);
						}
					}
				});
				if(matchSet.length > 0){
					drawRect.attr({
						cursor : "move"
					}).data("matchSet",matchSet);
					isChoosedState = true;
					var path = paper.path("M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z");
					path.click(function(){
						drawRect.closeIcon = null;
						this.remove();
						restoreDrawRect();
					}).attr({
						cursor : "pointer",
						fill : "#FA6161",
						title : "取消"
					}).transform("t" + [drawRectBBox.x2,drawRectBBox.y].join(','));
					drawRect.closeIcon = path;
					return;
				}
			}
			restoreDrawRect();
		}).toBack().attr({
			fill : "#f2f2f2",
			"stroke-width" : 0
		}).data("underRect",true);
	}
	return Choose;
});