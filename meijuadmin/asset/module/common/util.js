define(["avalon"], function (avalon) {
	"use strict";
	/*importStyle*/
	!function(){var a,b=/\W/g,c=document,d=document.getElementsByTagName("head")[0]||document.documentElement;avalon.importStyle=function(e,f){if(!f||(f=f.replace(b,"-"),!c.getElementById(f))){var g;if(!a||f?(g=c.createElement("style"),f&&(g.id=f),d.appendChild(g)):g=a,g.styleSheet){if(c.getElementsByTagName("style").length>31)throw new Error("Exceed the maximal count of style tags in IE");g.styleSheet.cssText+=e}else g.appendChild(c.createTextNode(e));f||(a=g)}}}();
	
});