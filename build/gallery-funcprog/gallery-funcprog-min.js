YUI.add("gallery-funcprog",function(B){function A(D,E){var C=B.Array(arguments,1,true);switch(B.Array.test(E)){case 1:return B.Array[D].apply(null,C);case 2:C[0]=B.Array(E,0,true);return B.Array[D].apply(null,C);default:if(E&&E[D]&&E!==B){C.shift();return E[D].apply(E,C);}else{return B.Object[D].apply(null,C);}}}B.mix(B,{every:function(E,D,F,C){return A("every",E,D,F,C);},filter:function(E,D,F,C){return A("filter",E,D,F,C);},find:function(E,D,F,C){return A("find",E,D,F,C);},map:function(E,D,F,C){return A("map",E,D,F,C);},partition:function(E,D,F,C){return A("partition",E,D,F,C);},reduce:function(F,E,D,G,C){return A("reduce",F,E,D,G,C);},reject:function(E,D,F,C){return A("reject",E,D,F,C);}});},"@VERSION@",{requires:["array-extras","gallery-object-extras","gallery-nodelist-extras2"]});