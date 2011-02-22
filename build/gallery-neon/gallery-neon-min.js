YUI.add("gallery-neon",function(E){function B(F){B.superclass.constructor.call(this,F);}B.NAME="NeonPlugin";B.NS="neon";B.ATTRS={backgroundColor:{validator:E.Lang.isString},textColor:{validator:E.Lang.isString},textShadow:{validator:E.Lang.isString},flickerCount:{value:10,validator:E.Lang.isNumber},easing:{value:E.Easing.easeIn,validator:E.Lang.isFunction}};function C(){E.later(Math.round(Math.random()*1000/(this.flicker_max-this.flicker_count)),this,D);this.node.setStyle("display","none");}function D(){this.flicker_count--;if(this.flicker_count>0){var G=this.get("easing");var F={r:G(this.flicker_count,parseInt(this.end_color[1],10),this.start_color[1]-this.end_color[1],this.flicker_max),g:G(this.flicker_count,parseInt(this.end_color[2],10),this.start_color[2]-this.end_color[2],this.flicker_max),b:G(this.flicker_count,parseInt(this.end_color[3],10),this.start_color[3]-this.end_color[3],this.flicker_max)};E.later(Math.round(Math.random()*1000/this.flicker_count),this,C);}else{var F={r:this.end_color[1],g:this.end_color[2],b:this.end_color[3]};}F="rgb("+Math.round(F.r)+","+Math.round(F.g)+","+Math.round(F.b)+")";this.node.setStyle("color",F);var H=this.get("textShadow");if(H){this.node.setStyle("textShadow",E.Lang.sub(H,{color:E.Color.toHex(F)}));}this.node.setStyle("display","");if(this.flicker_count===0){this.node.fire("neon:finished");}}function A(){if(!this._isHidden()){return;}var F=this.neon;F.node=this;F.flicker_max=Math.max(0,F.get("flickerCount"));F.flicker_count=F.flicker_max;F.start_color=E.Color.re_RGB.exec(E.Color.toRGB(F.get("backgroundColor")));F.end_color=E.Color.re_RGB.exec(E.Color.toRGB(F.get("textColor")));D.call(F);}E.extend(B,E.Plugin.Base,{initializer:function(F){this.get("host").show=A;}});E.namespace("Plugin");E.Plugin.Neon=B;},"@VERSION@",{requires:["node-style","node-pluginhost","anim-easing","plugin"]});