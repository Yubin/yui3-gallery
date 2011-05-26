YUI.add("gallery-exprbuilder",function(B){function E(K){E.superclass.constructor.call(this,K);}E.NAME="exprbuilder";E.ATTRS={fieldId:{value:B.guid(),validator:B.Lang.isString,writeOnce:true},fieldName:{value:"",validator:B.Lang.isString,writeOnce:true},formMgr:{validator:function(K){return(!K||K instanceof B.FormManager);},writeOnce:true},queryBuilder:{validator:function(K){return(!K||K instanceof B.QueryBuilder);},writeOnce:true},combinatorMap:{validator:B.Lang.isObject},parenLabel:{value:"()",validator:B.Lang.isString,writeOnce:true},andLabel:{value:"AND",validator:B.Lang.isString,writeOnce:true},orLabel:{value:"OR",validator:B.Lang.isString,writeOnce:true},notLabel:{value:"NOT",validator:B.Lang.isString,writeOnce:true},clearLabel:{value:"Clear",validator:B.Lang.isString,writeOnce:true},insertLabel:{value:"Insert",validator:B.Lang.isString,writeOnce:true},resetLabel:{value:"Cancel",validator:B.Lang.isString,writeOnce:true},tooManyParensError:{value:'The expression contains an extra closing parenthesis at "{context}...".',validator:B.Lang.isString},unmatchedSingleQuoteError:{value:'The expression contains an unmatched single quote at "{context}...".',validator:B.Lang.isString},unclosedParenError:{value:'The expression contains an unclosed parenthesis at "{context}...".',validator:B.Lang.isString},noVariableSelectedError:{value:"Please choose a variable.",validator:B.Lang.isString}};function F(){this.ie_range=document.selection.createRange();}function A(O,N){N=N||O.length;this.field.focus();var L=B.Node.getDOMNode(this.field);if(L.setSelectionRange){var P=L.selectionStart;L.value=L.value.substring(0,P)+O+L.value.substring(L.selectionEnd,L.value.length);var K=P+N;L.setSelectionRange(K,K);}else{if(document.selection){if(!this.ie_range){this.ie_range=document.selection.createRange();}var M=this.ie_range.duplicate();M.text=O;this.ie_range.move("character",N);this.ie_range.select();}}}function I(K){A.call(this,"()",1);K.halt();}function J(K){return function(L){A.call(this," "+this.get(K+"Label")+" ");L.halt();};}function D(K){this.clear();K.halt();}function H(R){if(!this.qb_form.validateForm()){R.halt();return;}var O=this.get("queryBuilder");var T=O.toDatabaseQuery();if(T.length===0){var N=O.get("contentBox").one("select");this.qb_form.displayMessage(N,this.get("noVariableSelectedError"),"error");R.halt();return;}var L=this.get("combinatorMap");var U="";var Q=" "+this.get("andLabel")+" ";for(var P=0;P<T.length;P++){var K=T[P];if(P>0){U+=Q;}U+=K[0];var S=K[1];if(S.indexOf("{")==-1){S+="{value}";}var M=L&&L[K[1]];if(M){Q=M.operator;S=M.pattern;}U+=B.Lang.substitute(S,{value:K[2].replace(/'/g,"\\'")});}A.call(this,U);O.reset();R.halt();}function G(K){this.qb_form.clearMessages();this.get("queryBuilder").reset();K.halt();}function C(L){if(L){var K=this;L.setFunction(this.get("fieldId"),function(M,N){return K._validateExpression(M,N,this);});}}B.extend(E,B.Widget,{initializer:function(K){C.call(this,K.formMgr);this.after("formMgrChange",function(L){if(L.prevVal){L.prevVal.setFunction(this.get("fieldId"),null);}C.call(this,L.newVal);});},renderUI:function(){var M=B.guid();var K=this.get("contentBox");K.set("innerHTML",this._field());this.field=K.one("#"+this.get("fieldId"));if(document.selection){this.field.on("change",F,this);}K.one("."+this.getClassName("paren")).on("click",I,this);var O=["and","or","not"];for(var L=0;L<O.length;L++){K.one("."+this.getClassName(O[L])).on("click",J(O[L]),this);}K.one("."+this.getClassName("clear")).on("click",D,this);var N=this.get("queryBuilder");if(N){K.appendChild(B.Node.create(this._query(M)));N.render(K.one("."+this.getClassName("querybuilder")));K.one("."+this.getClassName("insert")).on("click",H,this);K.one("."+this.getClassName("reset")).on("click",G,this);this.qb_form=new B.FormManager(M);this.qb_form.prepareForm();}},destructor:function(){var K=this.get("queryBuilder");if(K){K.destroy();}this.ie_range=null;},clear:function(){this.field.set("value","");this.field.focus();},_validateExpression:function(M,Q,R){var T=Q.get("value");var S=0;var P=-1;var K=false;var L=-1;for(var O=0;O<T.length;O++){if(!K&&T[O]=="("){if(S===0){P=O;}S++;}else{if(!K&&T[O]==")"){S--;if(S<0){var N=B.Lang.substitute(this.get("tooManyParensError"),{context:T.substr(0,O+1)});R.displayMessage(Q,N,"error");return false;}}else{if(T[O]=="'"&&(O===0||T[O-1]!="\\")){if(!K){L=O;}K=!K;}}}}if(K&&(S===0||L<P)){var N=B.Lang.substitute(this.get("unmatchedSingleQuoteError"),{context:T.substr(0,L+1)});R.displayMessage(Q,N,"error");return false;}else{if(S>0){var N=B.Lang.substitute(this.get("unclosedParenError"),{context:T.substr(0,P+1)});R.displayMessage(Q,N,"error");return false;}}return true;},_field:function(){var K='<div class="{td}">'+'<textarea id="{tid}" name="{tn}" class="formmgr-field {ta}"></textarea>'+"</div>"+'<div class="{fctl}">'+'<button class="{pc}">{paren}</button>'+'<button class="{ac}">{and}</button>'+'<button class="{oc}">{or}</button>'+'<button class="{nc}">{not}</button>'+'<button class="{cc}">{clear}</button>'+"</div>";return B.Lang.substitute(K,{td:this.getClassName("field-container"),ta:this.getClassName("field"),tid:this.get("fieldId"),tn:this.get("fieldName"),fctl:this.getClassName("controls"),pc:this.getClassName("paren"),ac:this.getClassName("and"),oc:this.getClassName("or"),nc:this.getClassName("not"),cc:this.getClassName("clear"),paren:this.get("parenLabel"),and:this.get("andLabel"),or:this.get("orLabel"),not:this.get("notLabel"),clear:this.get("clearLabel")});},_query:function(L){var K='<form name="{qbf}">'+'<div class="{qb}"></div>'+'<div class="{qbctl} formmgr-row">'+'<button class="{ic}">{insert}</button>'+'<button class="{rc}">{reset}</button>'+"</div>"+"</form>";return B.Lang.substitute(K,{qbf:L,qb:this.getClassName("querybuilder"),qbctl:this.getClassName("querybuilder-controls"),ic:this.getClassName("insert"),rc:this.getClassName("reset"),insert:this.get("insertLabel"),reset:this.get("resetLabel")});}});B.ExpressionBuilder=E;},"@VERSION@",{requires:["gallery-querybuilder","gallery-formmgr"],skinnable:true});
