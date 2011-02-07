YUI.add("gallery-aui-node-base",function(V){var F=V.Lang,O=F.isArray,N=F.isObject,Q=F.isString,E=F.isUndefined,c=F.isValue,J=V.ClassNameManager.getClassName,i=V.config,W="",R=[W,W],D="helper",h=J(D,"hidden"),X=J(D,"unselectable"),Z="innerHTML",f="nextSibling",L="none",K="parentNode",M="script",U=false,H="value";var T=document.createElement("div");T.style.display="none";T.innerHTML="   <link/><table></table>&nbsp;";if(T.attachEvent&&T.fireEvent){T.attachEvent("onclick",function(){U=true;T.detachEvent("onclick",arguments.callee);});T.cloneNode(true).fireEvent("onclick");}var P=!!T.getElementsByTagName("link").length,I=!T.getElementsByTagName("tbody").length,C=T.firstChild.nodeType===3;var b=/^\s+/,B=/=([^=\x27\x22>\s]+\/)>/g,a=/(<([\w:]+)[^>]*?)\/>/g,g=/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,S=/<([\w:]+)/,e=/<tbody/i,d=/<|&#?\w+;/,G=function(j,k,A){return g.test(A)?j:k+"></"+A+">";};var Y={_default:[0,W,W],area:[1,"<map>","</map>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],legend:[1,"<fieldset>","</fieldset>"],option:[1,'<select multiple="multiple">',"</select>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"]};Y.optgroup=Y.option;Y.tbody=Y.tfoot=Y.colgroup=Y.caption=Y.thead;Y.th=Y.td;if(!P){Y._default=[1,"div<div>","</div>"];}T=null;V.mix(V.Node.prototype,{ancestors:function(j){var A=this;var l=[];var m=A.getDOM();while(m&&m.nodeType!==9){if(m.nodeType===1){l.push(m);}m=m.parentNode;}var k=new V.all(l);if(j){k=k.filter(j);}return k;},ancestorsByClassName:function(l){var A=this;var k=[];var j=new RegExp("\\b"+l+"\\b");var m=A.getDOM();while(m&&m.nodeType!==9){if(m.nodeType===1&&j.test(m.className)){k.push(m);}m=m.parentNode;}return V.all(k);},appendTo:function(j){var A=this;V.one(j).append(A);return A;},attr:function(j,m){var A=this;if(!E(m)){var l=A.getDOM();if(j in l){A.set(j,m);}else{A.setAttribute(j,m);}return A;}else{if(N(j)){for(var k in j){A.attr(k,j[k]);}return A;}return A.get(j)||A.getAttribute(j);}},clone:(function(){var A;if(U){A=function(){var j=this.getDOM();var l;if(j.nodeType!=3){var k=this.outerHTML();k=k.replace(B,'="$1">').replace(b,"");l=V.one(V.Node._prepareHTML(k)[0]);}else{l=V.one(j.cloneNode());}return l;};}else{A=function(){return this.cloneNode(true);};}return A;})(),center:function(n){var A=this;n=(n&&V.one(n))||V.getBody();var l=n.get("region");var k=A.get("region");var m=l.left+(l.width/2);var j=l.top+(l.height/2);A.setXY([m-(k.width/2),j-(k.height/2)]);},empty:function(){var A=this;A.all(">*").remove().purge();var j=V.Node.getDOMNode(A);while(j.firstChild){j.removeChild(j.firstChild);}return A;},getDOM:function(){var A=this;return V.Node.getDOMNode(A);},guid:function(k){var j=this;var A=j.get("id");if(!A){A=V.stamp(j);j.set("id",A);}return A;},hide:function(j){var A=this;A.addClass(j||A._hideClass||h);return A;},hover:function(k,j){var A=this;var l;var o=A._defaultHoverOptions;if(N(k,true)){l=k;l=V.mix(l,o);k=l.over;j=l.out;}else{l=V.mix({over:k,out:j},o);}A._hoverOptions=l;var n=new V.DelayedTask(A._hoverOverTaskFn,A);var m=new V.DelayedTask(A._hoverOutTaskFn,A);l.overTask=n;l.outTask=m;A.on(l.overEventType,A._hoverOverHandler,A);A.on(l.outEventType,A._hoverOutHandler,A);},html:function(){var A=arguments,j=A.length;if(j){this.set(Z,A[0]);}else{return this.get(Z);}return this;},outerHTML:function(){var A=this;var k=A.getDOM();if("outerHTML" in k){return k.outerHTML;}var j=V.Node.create("<div></div>").append(this.clone());try{return j.html();}catch(l){}finally{j=null;}},placeAfter:function(j){var A=this;return A._place(j,A.get(f));},placeBefore:function(j){var A=this;return A._place(j,A);},prependTo:function(j){var A=this;V.one(j).prepend(A);return A;},radioClass:function(j){var A=this;A.siblings().removeClass(j);A.addClass(j);return A;},resetId:function(j){var A=this;A.attr("id",V.guid(j));return A;},selectText:function(o,k){var A=this;var j=A.getDOM();var m=A.val().length;k=c(k)?k:m;o=c(o)?o:0;try{if(j.setSelectionRange){j.setSelectionRange(o,k);}else{if(j.createTextRange){var l=j.createTextRange();l.moveStart("character",o);l.moveEnd("character",k-m);l.select();}else{j.select();}}if(j!=document.activeElement){j.focus();}}catch(n){}return A;},selectable:function(){var A=this;A.getDOM().unselectable="off";A.detach("selectstart");A.setStyles({"MozUserSelect":"","KhtmlUserSelect":""});A.removeClass(X);return A;},show:function(j){var A=this;A.removeClass(j||A._hideClass||h);return A;},swallowEvent:function(j,k){var A=this;var l=function(m){m.stopPropagation();if(k){m.preventDefault();m.halt();}return false;};if(O(j)){V.Array.each(j,function(m){A.on(m,l);});return this;}else{A.on(j,l);}return A;},text:function(k){var A=this;var j=A.getDOM();if(!E(k)){k=V.DOM._getDoc(j).createTextNode(k);return A.empty().append(k);}return A._getText(j.childNodes);},toggle:function(j){var A=this;var k="hide";var l=j||A._hideClass||h;if(A.hasClass(l)){k="show";}A[k](l);return A;},unselectable:function(){var A=this;A.getDOM().unselectable="on";A.swallowEvent("selectstart",true);A.setStyles({"MozUserSelect":L,"KhtmlUserSelect":L});A.addClass(X);return A;},val:function(j){var A=this;if(E(j)){return A.get(H);}else{return A.set(H,j);}},_getText:function(n){var A=this;var l=n.length;var k;var m=[];for(var j=0;j<l;j++){k=n[j];if(k&&k.nodeType!=8){if(k.nodeType!=1){m.push(k.nodeValue);}if(k.childNodes){m.push(A._getText(k.childNodes));}}}return m.join("");},_hoverOutHandler:function(k){var A=this;var j=A._hoverOptions;j.outTask.delay(j.outDelay,null,null,[k]);},_hoverOverHandler:function(k){var A=this;var j=A._hoverOptions;j.overTask.delay(j.overDelay,null,null,[k]);},_hoverOutTaskFn:function(k){var A=this;var j=A._hoverOptions;j.overTask.cancel();j.out.apply(j.context||k.currentTarget,arguments);},_hoverOverTaskFn:function(k){var A=this;var j=A._hoverOptions;j.outTask.cancel();j.over.apply(j.context||k.currentTarget,arguments);},_place:function(k,j){var A=this;var l=A.get(K);if(l){if(Q(k)){k=V.Node.create(k);
}l.insertBefore(k,j);}return A;},_defaultHoverOptions:{overEventType:"mouseenter",outEventType:"mouseleave",overDelay:0,outDelay:0,over:F.emptyFn,out:F.emptyFn}},true);if(!I){V.DOM._ADD_HTML=V.DOM.addHTML;V.DOM.addHTML=function(m,l,A){var n=(m.nodeName&&m.nodeName.toLowerCase())||"";var j;if(!E(l)){if(Q(l)){j=(S.exec(l)||R)[1];}else{if(l.nodeName){j=l.nodeName;}}j=j.toLowerCase();}if(n=="table"&&j=="tr"){m=m.getElementsByTagName("tbody")[0]||m.appendChild(m.ownerDocument.createElement("tbody"));var k=((A&&A.nodeName)||W).toLowerCase();if(k=="tbody"&&A.childNodes.length>0){A=A.firstChild;}}V.DOM._ADD_HTML(m,l,A);};}V.Node._prepareHTML=function(q){var r=i.doc;var m=[];if(Q(q)){if(!d.test(q)){q=r.createTextNode(q);}else{q=q.replace(a,G);var k=(S.exec(q)||R)[1].toLowerCase();var j=Y[k]||Y._default;var p=j[0];var A=r.createElement("div");A.innerHTML=j[1]+q+j[2];while(p--){A=A.lastChild;}if(!I){var s=e.test(q);var o=[];if(k=="table"&&!s){if(A.firstChild){o=A.firstChild.childNodes;}}else{if(j[1]=="<table>"&&!s){o=A.childNodes;}}for(var n=o.length-1;n>=0;--n){var l=o[n];if(l.nodeName.toLowerCase()=="tbody"&&l.childNodes.length){l.parentNode.removeChild(l);}}}if(!C&&b.test(q)){A.insertBefore(r.createTextNode(b.exec(q)[0]),A.firstChild);}q=A.childNodes;}}if(q.nodeType){m.push(q);}else{m=q;}return m;};V.NodeList.importMethod(V.Node.prototype,["after","appendTo","attr","before","empty","hide","hover","html","outerHTML","prepend","prependTo","purge","selectText","selectable","show","text","toggle","unselectable","val"]);V.mix(V.NodeList.prototype,{all:function(k){var j=this;var o=[];var l=j._nodes;var n=l.length;var A;for(var m=0;m<n;m++){A=V.Selector.query(k,l[m]);if(A&&A.length){o.push.apply(o,A);}}o=V.Array.unique(o);return V.all(o);},first:function(){var A=this;return instacne.item(0);},getDOM:function(){var A=this;return V.NodeList.getDOMNodes(this);},last:function(){var A=this;return A.item(A._nodes.length-1);},one:function(j){var A=this;var m=null;var k=A._nodes;var n=k.length;for(var l=0;l<n;l++){m=V.Selector.query(j,k[l],true);if(m){m=V.one(m);break;}}return m;}});V.mix(V,{getBody:function(){var A=this;if(!A._bodyNode){A._bodyNode=V.one(i.doc.body);}return A._bodyNode;},getDoc:function(){var A=this;if(!A._documentNode){A._documentNode=V.one(i.doc);}return A._documentNode;},getWin:function(){var A=this;if(!A._windowNode){A._windowNode=V.one(i.win);}return A._windowNode;}});},"gallery-2010.08.18-17-12",{requires:["gallery-aui-base"]});