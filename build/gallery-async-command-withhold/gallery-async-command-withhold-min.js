YUI.add("gallery-async-command-withhold",function(a){(function(f,b){var c="withhold",e=f.Plugin,d=f.delay;e.AsyncCommandWithhold=f.Base.create(b,e.Base,[],{initializer:function(){var g=this;g.onHostEvent(["failure","success"],function(h){h.preventDefault();var i=h.target.getEvent(h.type);d(i.defaultFn,g.get(c)).apply(i,arguments);});}},{ATTRS:{withhold:{value:0,writeOnce:"initOnly"}},NS:c});}(a,arguments[1]));},"gallery-2012.06.20-20-07",{requires:["gallery-async-command","gallery-delay","plugin"],skinnable:false});