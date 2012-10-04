YUI.add("gallery-bulkedit",function(Y){function BulkEditDataSource(){BulkEditDataSource.superclass.constructor.apply(this,arguments);}BulkEditDataSource.NAME="bulkEditDataSource";BulkEditDataSource.ATTRS={ds:{writeOnce:true},generateRequest:{validator:Y.Lang.isFunction,writeOnce:true},uniqueIdKey:{validator:Y.Lang.isString,writeOnce:true},generateUniqueId:{value:function(){idCounter++;return uniqueIdPrefix+idCounter;},validator:Y.Lang.isFunction,writeOnce:true},startIndexExpr:{validator:Y.Lang.isString,writeOnce:true},totalRecordsReturnExpr:{validator:Y.Lang.isString,writeOnce:true},extractTotalRecords:{validator:Y.Lang.isFunction,writeOnce:true}};var uniqueIdPrefix="bulk-edit-new-id-",idCounter=0,inserted_prefix="be-ds-i:",inserted_re=/^be-ds-i:/,removed_prefix="be-ds-r:",removed_re=/^be-ds-r:/;BulkEditDataSource.comparator={"string":function(a,b){return(Y.Lang.trim(a.toString())===Y.Lang.trim(b.toString()));},"integer":function(a,b){return(parseInt(a,10)===parseInt(b,10));},"decimal":function(a,b){return(parseFloat(a,10)===parseFloat(b,10));},"boolean":function(a,b){return(((a&&b)||(!a&&!b))?true:false);}};function fromDisplayIndex(index){var count=-1;for(var i=0;i<this._index.length;i++){var j=this._index[i];if(!removed_re.test(j)){count++;if(count===index){return i;}}}return false;}function adjustRequest(){var r=this._callback.request;this._callback.adjust={origStart:r.startIndex,origCount:r.resultCount};if(!this._index){return;}var start=Math.min(r.startIndex,this._index.length);var end=0;for(var i=0;i<start;i++){var j=this._index[i];if(!inserted_re.test(j)){end++;}if(removed_re.test(j)){start++;}}r.startIndex=end;this._callback.adjust.indexStart=i;var count=0;while(i<this._index.length&&count<this._callback.adjust.origCount){var j=this._index[i];if(inserted_re.test(j)){r.resultCount--;}if(removed_re.test(j)){r.resultCount++;}else{count++;}i++;}this._callback.adjust.indexEnd=i;}function internalSuccess(e){if(!e.response||e.error||!Y.Lang.isArray(e.response.results)){internalFailure.apply(this,arguments);return;}if(!Y.Lang.isUndefined(this._callback._tId)&&e.tId!==this._callback._tId){return;}this._callback.response=e.response;checkFinished.call(this);}function internalFailure(e){if(e.tId===this._callback._tId){this._callback.error=e.error;this._callback.response=e.response;this.fire("response",this._callback);}}function checkFinished(){if(this._generatingRequest||!this._callback.response){return;}if(!this._fields){this._fields={};Y.Array.each(this.get("ds").schema.get("schema").resultFields,function(value){if(Y.Lang.isObject(value)){this._fields[value.key]=value;}},this);}var response={};Y.mix(response,this._callback.response);response.results=[];response=Y.clone(response,true);var dataStartIndex=0;if(this.get("startIndexExpr")){eval("dataStartIndex=this._callback.response"+this.get("startIndexExpr"));}var startIndex=this._callback.request.startIndex-dataStartIndex;response.results=this._callback.response.results.slice(startIndex,startIndex+this._callback.request.resultCount);if(!this._index){if(this.get("totalRecordsReturnExpr")){eval("response"+this.get("totalRecordsReturnExpr")+"="+this._callback.response.results.length);}this._count=this.get("extractTotalRecords")(response);this._index=[];for(var i=0;i<this._count;i++){this._index.push(i);}}else{var adjust=this._callback.adjust;for(var i=adjust.indexStart,k=0;i<adjust.indexEnd;i++,k++){var j=this._index[i];if(inserted_re.test(j)){var id=j.substr(inserted_prefix.length);response.results.splice(k,0,Y.clone(this._new[id],true));}else{if(removed_re.test(j)){response.results.splice(k,1);k--;}}}}this._records=[];this._recordMap={};var uniqueIdKey=this.get("uniqueIdKey");Y.Array.each(response.results,function(value){var rec=Y.clone(value,true);this._records.push(rec);this._recordMap[rec[uniqueIdKey]]=rec;},this);Y.Array.each(response.results,function(rec){var diff=this._diff[rec[uniqueIdKey]];if(diff){Y.mix(rec,diff,true);}},this);this._callback.response=response;this.fire("response",this._callback);}Y.extend(BulkEditDataSource,Y.DataSource.Local,{initializer:function(config){if(!(config.ds instanceof Y.DataSource.Local)){Y.error("BulkEditDataSource requires DataSource");}if(!config.generateRequest){Y.error("BulkEditDataSource requires generateRequest function");}if(!config.uniqueIdKey){Y.error("BulkEditDataSource requires uniqueIdKey configuration");}if(!config.extractTotalRecords){Y.error("BulkEditDataSource requires extractTotalRecords function");}this._index=null;this._count=0;this._new={};this._diff={};},_dataIsLocal:function(){return(Y.Lang.isArray(this.get("ds").get("source")));},_flushCache:function(){var ds=this.get("ds");if(ds.cache&&Y.Lang.isFunction(ds.cache.flush)){ds.cache.flush();}},getRecordCount:function(){return this._count;},getCurrentRecords:function(){return this._records;},getCurrentRecordMap:function(){return this._recordMap;},getValue:function(record_index,key){if(!this._dataIsLocal()){Y.error("BulkEditDataSource.getValue() can only be called when using a local datasource");}var j=fromDisplayIndex.call(this,record_index);if(j===false){return false;}j=this._index[j];if(inserted_re.test(j)){var record_id=j.substr(inserted_prefix.length);var record=this._new[record_id];}else{var record=this.get("ds").get("source")[j];var record_id=record[this.get("uniqueIdKey")];}if(this._diff[record_id]&&!Y.Lang.isUndefined(this._diff[record_id][key])){return this._diff[record_id][key];}else{return record[key];}},getChanges:function(){return this._diff;},getRemovedRecordIndexes:function(){var list=[];Y.Array.each(this._index,function(j){if(removed_re.test(j)){list.push(parseInt(j.substr(removed_prefix.length),10));}});return list;},insertRecord:function(index,record){this._count++;var record_id=String(this.get("generateUniqueId")());this._new[record_id]={};this._new[record_id][this.get("uniqueIdKey")]=record_id;var j=fromDisplayIndex.call(this,index);if(j===false){j=this._index.length;}this._index.splice(j,0,inserted_prefix+record_id);
if(record&&!Y.Lang.isObject(record)){var s=record.toString();record=Y.clone(this._recordMap[s]||this._new[s],true);var diff=this._diff[s];if(record&&diff){Y.mix(record,diff,true);}}if(record){var uniqueIdKey=this.get("uniqueIdKey");Y.Object.each(record,function(value,key){if(key!=uniqueIdKey){this.updateValue(record_id,key,value);}},this);}return record_id;},removeRecord:function(index){var j=fromDisplayIndex.call(this,index);if(j===false){return false;}this._count--;if(inserted_re.test(this._index[j])){var record_id=this._index[j].substr(inserted_prefix.length);delete this._new[record_id];this._index.splice(j,1);}else{if(this._dataIsLocal()){var record_id=this.get("ds").get("source")[this._index[j]][this.get("uniqueIdKey")].toString();}this._index[j]=removed_prefix+this._index[j];}if(record_id){delete this._diff[record_id];}return true;},updateValue:function(record_id,key,value){if(key==this.get("uniqueIdKey")){Y.error("BulkEditDataSource.updateValue() does not allow changing the id for a record.  Use BulkEditDataSource.updateRecordId() instead.");}record_id=record_id.toString();var record=this._recordMap[record_id];if(record&&this._getComparator(key)(Y.Lang.isValue(record[key])?record[key]:"",Y.Lang.isValue(value)?value:"")){if(this._diff[record_id]){delete this._diff[record_id][key];}}else{if(!this._diff[record_id]){this._diff[record_id]={};}this._diff[record_id][key]=value;}},_getComparator:function(key){var f=(this._fields[key]&&this._fields[key].comparator)||"string";if(Y.Lang.isFunction(f)){return f;}else{if(BulkEditDataSource.comparator[f]){return BulkEditDataSource.comparator[f];}else{return BulkEditDataSource.comparator.string;}}},mergeChanges:function(record_id){if(!this._dataIsLocal()){Y.error("BulkEditDataSource.mergeChanges() can only be called when using a local datasource");}record_id=record_id.toString();function merge(rec){if(rec[this.get("uniqueIdKey")].toString()===record_id){var diff=this._diff[record_id];if(diff){Y.mix(rec,diff,true);delete this._diff[record_id];}return true;}}var found=false;this._flushCache();Y.Array.some(this.get("ds").get("source"),function(value){if(merge.call(this,value)){found=true;return true;}},this);if(!found){Y.Object.some(this._new,function(value){if(merge.call(this,value)){found=true;return true;}},this);}},killRecord:function(record_id){if(!this._dataIsLocal()){Y.error("BulkEditDataSource.killRecord() can only be called when using a local datasource");}record_id=record_id.toString();function kill(rec){if(rec[this.get("uniqueIdKey")].toString()===record_id){var info={};this.recordIdToIndex(record_id,info);var j=this._index[info.internal_index];this._index.splice(info.internal_index,1);if(!inserted_re.test(j)){for(var i=info.internal_index;i<this._index.length;i++){var k=this._index[i];if(removed_re.test(k)){this._index[i]=removed_prefix+(parseInt(k.substr(removed_prefix.length),10)-1);}else{if(!inserted_re.test(k)){this._index[i]--;}}}}this._count--;delete this._diff[record_id];return true;}}var found=false;this._flushCache();var data=this.get("ds").get("source");Y.Array.some(data,function(value,i){if(kill.call(this,value)){data.splice(i,1);found=true;return true;}},this);if(!found){Y.Object.some(this._new,function(value,id){if(kill.call(this,value)){delete this._new[id];found=true;return true;}},this);}},updateRecordId:function(orig_record_id,new_record_id){if(!this._dataIsLocal()){Y.error("BulkEditDataSource.updateRecordId() can only be called when using a local datasource");}orig_record_id=orig_record_id.toString();new_record_id=new_record_id.toString();function update(rec){if(rec[this.get("uniqueIdKey")].toString()===orig_record_id){var info={};this.recordIdToIndex(orig_record_id,info);var j=info.internal_index;if(inserted_re.test(this._index[j])){this._index[j]=inserted_prefix+new_record_id;}rec[this.get("uniqueIdKey")]=new_record_id;if(this._diff[orig_record_id]){this._diff[new_record_id]=this._diff[orig_record_id];delete this._diff[orig_record_id];}return true;}}var found=false;this._flushCache();Y.Array.some(this.get("ds").get("source"),function(value){if(update.call(this,value)){found=true;return true;}},this);if(!found){Y.Object.some(this._new,function(value,id){if(update.call(this,value)){this._new[new_record_id]=value;delete this._new[id];found=true;return true;}},this);}},recordIdToIndex:function(record_id,return_info){if(!this._dataIsLocal()){Y.error("BulkEditDataSource.recordIdToIndex() can only be called when using a local datasource");}record_id=record_id.toString();var records=this.get("ds").get("source");var count=0;for(var i=0;i<this._index.length;i++){var j=this._index[i];var ins=inserted_re.test(j);var del=removed_re.test(j);if((ins&&j.substr(inserted_prefix.length)===record_id)||(!ins&&!del&&records[j][this.get("uniqueIdKey")].toString()===record_id)){if(return_info){return_info.internal_index=i;}return count;}if(!del){count++;}}return -1;},_defRequestFn:function(e){this._callback=e;adjustRequest.call(this);this._generatingRequest=true;this._callback._tId=this.get("ds").sendRequest({request:this.get("generateRequest")(this._callback.request),callback:{success:Y.bind(internalSuccess,this),failure:Y.bind(internalFailure,this)}});this._generatingRequest=false;checkFinished.call(this);}});Y.BulkEditDataSource=BulkEditDataSource;Y.namespace("DataSource").BulkEdit=BulkEditDataSource;function BulkEditor(){BulkEditor.superclass.constructor.apply(this,arguments);}BulkEditor.NAME="bulkedit";BulkEditor.ATTRS={ds:{validator:function(value){return(value instanceof BulkEditDataSource);},writeOnce:true},fields:{validator:Y.Lang.isObject,writeOnce:true},paginator:{validator:function(value){return(value instanceof Y.Paginator);},writeOnce:true},requestExtra:{value:{},validator:Y.Lang.isObject,writeOnce:true},pingClass:{value:Y.ClassNameManager.getClassName(BulkEditor.NAME,"ping"),validator:Y.Lang.isString},pingTimeout:{value:2,validator:Y.Lang.isNumber}};var default_page_size=1000000000,id_prefix="bulk-editor",id_separator="__",id_regex=new RegExp("^"+id_prefix+id_separator+"(.+?)(?:"+id_separator+"(.+?))?$"),status_prefix="bulkedit-has",status_pattern=status_prefix+"([a-z]+)",status_re=new RegExp(Y.Node.class_re_prefix+status_pattern+Y.Node.class_re_suffix),record_status_prefix="bulkedit-hasrecord",record_status_pattern=record_status_prefix+"([a-z]+)",record_status_re=new RegExp(Y.Node.class_re_prefix+record_status_pattern+Y.Node.class_re_suffix),message_container_class=Y.ClassNameManager.getClassName(BulkEditor.NAME,"message-text"),perl_flags_regex=/^\(\?([a-z]+)\)/;
BulkEditor.record_container_class=Y.ClassNameManager.getClassName(BulkEditor.NAME,"bd");BulkEditor.record_msg_container_class=Y.ClassNameManager.getClassName(BulkEditor.NAME,"record-message-container");BulkEditor.field_container_class=Y.ClassNameManager.getClassName(BulkEditor.NAME,"field-container");BulkEditor.field_container_class_prefix=BulkEditor.field_container_class+"-";BulkEditor.field_class_prefix=Y.ClassNameManager.getClassName(BulkEditor.NAME,"field")+"-";function switchPage(state){this.saveChanges();var pg=this.get("paginator");pg.setTotalRecords(state.totalRecords,true);pg.setStartIndex(state.recordOffset,true);pg.setRowsPerPage(state.rowsPerPage,true);pg.setPage(state.page,true);this._updatePageStatus();this.reload();}Y.extend(BulkEditor,Y.Widget,{initializer:function(config){if(config.paginator){config.paginator.on("changeRequest",switchPage,this);}},renderUI:function(){this.clearServerErrors();this.reload();},bindUI:function(){this._attachEvents(this.get("contentBox"));},_attachEvents:function(container){Y.delegate("bulkeditor|click",handleCheckboxMultiselect,container,".checkbox-multiselect input",this);},reload:function(){if(!this.busy){this.plug(Y.Plugin.BusyOverlay);}this.busy.show();var pg=this.get("paginator");var request={startIndex:pg?pg.getStartIndex():0,resultCount:pg?pg.getRowsPerPage():default_page_size};Y.mix(request,this.get("requestExtra"));var ds=this.get("ds");ds.sendRequest({request:request,callback:{success:Y.bind(function(e){this.busy.hide();if(pg&&pg.getStartIndex()>=ds.getRecordCount()){pg.setPage(pg.getPreviousPage());return;}this._render(e.response);this._updatePaginator(e.response);this.scroll_to_index=-1;},this),failure:Y.bind(function(){this.busy.hide();this.scroll_to_index=-1;},this)}});},saveChanges:function(){var ds=this.get("ds");var records=ds.getCurrentRecords();var id_key=ds.get("uniqueIdKey");Y.Object.each(this.get("fields"),function(field,key){Y.Array.each(records,function(r){var node=this.getFieldElement(r,key),tag=node.get("tagName").toLowerCase(),value;if(tag=="input"&&node.get("type").toLowerCase()=="checkbox"){value=node.get("checked")?field.values.on:field.values.off;}else{if(tag=="select"&&node.get("multiple")){value=Y.reduce(Y.Node.getDOMNode(node).options,[],function(v,o){if(o.selected){v.push(o.value);}return v;});}else{value=node.get("value");}}ds.updateValue(r[id_key],key,value);},this);},this);},getAllValues:function(callback){var request={startIndex:0,resultCount:this.get("ds").getRecordCount()};Y.mix(request,this.get("requestExtra"));this.get("ds").sendRequest({request:request,callback:callback});},getChanges:function(){return this.get("ds").getChanges();},insertRecord:function(index,record){var record_id=this.get("ds").insertRecord(index,record);if(index<=this.server_errors.records.length){this.server_errors.records.splice(index,0,{id:record_id});this._updatePageStatus();}return record_id;},removeRecord:function(index){if(this.get("ds").removeRecord(index)){if(index<this.server_errors.records.length){var rec=this.server_errors.records[index];this.server_errors.records.splice(index,1);delete this.server_errors.record_map[rec[this.get("ds").get("uniqueIdKey")]];this._updatePageStatus();}return true;}else{return false;}},getFieldConfig:function(key){return this.get("fields")[key]||{};},getRecordContainerId:function(record){if(Y.Lang.isString(record)){return id_prefix+id_separator+record;}else{return id_prefix+id_separator+record[this.get("ds").get("uniqueIdKey")];}},getFieldId:function(record,key){return this.getRecordContainerId(record)+id_separator+key;},getRecordAndFieldKey:function(field){var m=id_regex.exec(Y.Lang.isString(field)?field:field.get("id"));if(m&&m.length>0){return{record:this.get("ds").getCurrentRecordMap()[m[1]],field_key:m[2]};}},getRecordId:function(obj){if(Y.Lang.isObject(obj)&&!obj._node){return obj[this.get("ds").get("uniqueIdKey")];}var node=obj.getAncestorByClassName(BulkEditor.record_container_class,true);if(node){var m=id_regex.exec(node.get("id"));if(m&&m.length>0){return m[1];}}},getRecordContainer:function(record){if(Y.Lang.isString(record)){var id=id_prefix+id_separator+record;}else{if(record&&record._node){return record.getAncestorByClassName(BulkEditor.record_container_class,true);}else{var id=this.getRecordContainerId(record);}}return Y.one("#"+id);},getFieldContainer:function(record,key){var field=this.getFieldElement(record,key);return field.getAncestorByClassName(BulkEditor.field_container_class,true);},getFieldElement:function(record,key){if(record&&record._node){record=this.getRecordId(record);}return Y.one("#"+this.getFieldId(record,key));},showRecordIndex:function(index){if(index<0||this.get("ds").getRecordCount()<=index){return;}var pg=this.get("paginator");var start=pg?pg.getStartIndex():0;var count=pg?pg.getRowsPerPage():default_page_size;if(start<=index&&index<start+count){var node=this.getRecordContainer(this.get("ds").getCurrentRecords()[index-start]);node.scrollIntoView();this.pingRecord(node);}else{if(pg){this.scroll_to_index=index;pg.setPage(1+Math.floor(index/count));}}},showRecordId:function(id){var index=this.get("ds").recordIdToIndex(id);if(index>=0){this.showRecordIndex(index);}},pingRecord:function(record){var ping=this.get("pingClass");if(ping){var node=this.getRecordContainer(record);node.addClass(ping);Y.later(this.get("pingTimeout")*1000,null,function(){node.removeClass(ping);});}},_render:function(response){var container=this.get("contentBox");this._renderContainer(container);container.set("scrollTop",0);container.set("scrollLeft",0);Y.Array.each(response.results,function(record){var node=this._renderRecordContainer(container,record);this._renderRecord(node,record);},this);this.fire("pageRendered");if(this.auto_validate){this.validate();}if(this.scroll_to_index>=0){this.showRecordIndex(this.scroll_to_index);this.scroll_to_index=-1;}},_renderContainer:function(container){container.set("innerHTML","");},_renderRecordContainer:function(container,record){return null;},_renderRecord:function(container,record){Y.Object.each(this.get("fields"),function(field,key){this._renderField({container:container,key:key,value:record[key],field:field,record:record});
},this);},_renderField:function(o){},_updatePaginator:function(response){var pg=this.get("paginator");if(pg){pg.setTotalRecords(this.get("ds").getRecordCount(),true);}},clearServerErrors:function(){if(this.server_errors&&this.server_errors.page&&this.server_errors.page.length){this.fire("clearErrorNotification");}this.server_errors={page:[],records:[],record_map:{}};var pg=this.get("paginator");if(pg){pg.set("pageStatus",[]);}this.first_error_page=-1;this._clearValidationMessages();},setServerErrors:function(page_errors,record_field_errors){if(this.server_errors.page.length&&(!page_errors||!page_errors.length)){this.fire("clearErrorNotification");}this.server_errors={page:page_errors||[],records:record_field_errors||[],record_map:Y.Array.toObject(record_field_errors||[],"id")};this._updatePageStatus();var pg=this.get("paginator");if(!pg||pg.getCurrentPage()===this.first_error_page){this.validate();}else{this.auto_validate=true;pg.setPage(this.first_error_page);}},_updatePageStatus:function(){var pg=this.get("paginator");if(!pg){return;}var page_size=pg?pg.getRowsPerPage():default_page_size;var status=this.page_status.slice(0);this.first_error_page=-1;var r=this.server_errors.records;for(var i=0;i<r.length;i++){if(r[i].recordError||r[i].fieldErrors){var j=Math.floor(i/page_size);status[j]="error";if(this.first_error_page==-1){this.first_error_page=i;}}}pg.set("pageStatus",status);},validate:function(){this.saveChanges();this._clearValidationMessages();this.auto_validate=true;var status=this._validateVisibleFields();var pg=this.get("paginator");if(!status&&pg){this.page_status[pg.getCurrentPage()-1]="error";}status=this._validateAllPages()&&status;if(!status||this.server_errors.page.length||this.server_errors.records.length){var err=this.server_errors.page.slice(0);if(err.length===0){err.push(Y.FormManager.Strings.validation_error);}this.fire("notifyErrors",{msgs:err});this.get("contentBox").getElementsByClassName(BulkEditor.record_container_class).some(function(node){if(node.hasClass(status_pattern)){node.scrollIntoView();return true;}});}this._updatePageStatus();return status;},_validateVisibleFields:function(container){var status=true;if(!container){container=this.get("contentBox");}var e1=container.getElementsByTagName("input");var e2=container.getElementsByTagName("textarea");var e3=container.getElementsByTagName("select");Y.FormManager.cleanValues(e1);Y.FormManager.cleanValues(e2);status=this._validateElements(e1)&&status;status=this._validateElements(e2)&&status;status=this._validateElements(e3)&&status;container.getElementsByClassName(BulkEditor.record_container_class).each(function(node){var id=this.getRecordId(node);var err=this.server_errors.record_map[id];if(err&&err.recordError){err=err.recordError;if(Y.Lang.isString(err)){var msg=err;var type="error";}else{var msg=err.msg;var type=err.type;}this.displayRecordMessage(id,msg,type,false);status=status&&!(type=="error"||type=="warn");}},this);return status;},_validateElements:function(nodes){var status=true;nodes.each(function(node){var field_info=this.getRecordAndFieldKey(node);if(!field_info){return;}var field=this.getFieldConfig(field_info.field_key);var msg_list=field.validation&&field.validation.msg;var info=Y.FormManager.validateFromCSSData(node,msg_list);if(info.error){this.displayFieldMessage(node,info.error,"error",false);status=false;return;}if(info.keepGoing){if(field.validation&&Y.Lang.isString(field.validation.regex)){var flags="";var m=perl_flags_regex.exec(field.validation.regex);if(m&&m.length==2){flags=m[1];field.validation.regex=field.validation.regex.replace(perl_flags_regex,"");}field.validation.regex=new RegExp(field.validation.regex,flags);}if(field.validation&&field.validation.regex instanceof RegExp&&!field.validation.regex.test(node.get("value"))){this.displayFieldMessage(node,msg_list&&msg_list.regex,"error",false);status=false;return;}}if(field.validation&&Y.Lang.isFunction(field.validation.fn)&&!field.validation.fn.call(this,node)){status=false;return;}var err=this.server_errors.record_map[this.getRecordId(field_info.record)];if(err&&err.fieldErrors){var f=err.fieldErrors[field_info.field_key];if(f){if(Y.Lang.isString(f)){var msg=f;var type="error";}else{var msg=f.msg;var type=f.type;}this.displayFieldMessage(node,msg,type,false);status=status&&!(type=="error"||type=="warn");return;}}},this);return status;},_validateAllPages:function(){var ds=this.get("ds");var pg=this.get("paginator");if(!pg||!ds._dataIsLocal()){return true;}if(!this.validation_node){this.validation_node=Y.Node.create("<input></input>");}if(!this.validation_keys){this.validation_keys=[];Y.Object.each(this.get("fields"),function(value,key){if(value.validation){this.validation_keys.push(key);}},this);}var count=ds.getRecordCount();var page_size=pg.getRowsPerPage();for(var i=0;i<count;i++){var status=true;Y.Array.each(this.validation_keys,function(key){var field=this.get("fields")[key];var value=ds.getValue(i,key);this.validation_node.set("value",Y.Lang.isUndefined(value)?"":value);this.validation_node.set("className",field.validation.css||"");var info=Y.FormManager.validateFromCSSData(this.validation_node);if(info.error){status=false;return;}if(info.keepGoing){if(field.validation.regex instanceof RegExp&&!field.validation.regex.test(value)){status=false;return;}}},this);if(!status){var j=Math.floor(i/page_size);i=(j+1)*page_size-1;this.page_status[j]="error";}}return true;},_clearValidationMessages:function(){this.has_validation_messages=false;this.auto_validate=false;this.page_status=[];this.fire("clearErrorNotification");var container=this.get("contentBox");container.getElementsByClassName(status_pattern).removeClass(status_pattern);container.getElementsByClassName(record_status_pattern).removeClass(record_status_pattern);container.getElementsByClassName(message_container_class).set("innerHTML","");},displayFieldMessage:function(e,msg,type,scroll){if(Y.Lang.isUndefined(scroll)){scroll=!this.has_validation_messages;}var bd1=this.getRecordContainer(e);
var changed=this._updateRecordStatus(bd1,type,status_pattern,status_re,status_prefix);var bd2=e.getAncestorByClassName(BulkEditor.field_container_class);if(Y.FormManager.statusTakesPrecedence(this._getElementStatus(bd2,status_re),type)){if(msg){var m=bd2.getElementsByClassName(message_container_class);if(m&&m.size()>0){m.item(0).set("innerHTML",msg);}}bd2.replaceClass(status_pattern,status_prefix+type);this.has_validation_messages=true;}if(changed&&scroll){bd1.scrollIntoView();}},displayRecordMessage:function(id,msg,type,scroll){if(Y.Lang.isUndefined(scroll)){scroll=!this.has_validation_messages;}var bd1=this.getRecordContainer(id);var changed=this._updateRecordStatus(bd1,type,status_pattern,status_re,status_prefix);if(this._updateRecordStatus(bd1,type,record_status_pattern,record_status_re,record_status_prefix)&&msg){var bd2=bd1.getElementsByClassName(BulkEditor.record_msg_container_class).item(0);if(bd2){var m=bd2.getElementsByClassName(message_container_class);if(m&&m.size()>0){m.item(0).set("innerHTML",msg);}}}if(changed&&scroll){bd1.scrollIntoView();}},_getElementStatus:function(n,r){var m=r.exec(n.get("className"));return(m&&m.length>1?m[1]:false);},_updateRecordStatus:function(bd,type,p,r,prefix){if(Y.FormManager.statusTakesPrecedence(this._getElementStatus(bd,r),type)){bd.replaceClass(p,prefix+type);this.has_validation_messages=true;return true;}return false;}});BulkEditor.cleanHTML=function(s){return(Y.Lang.isValue(s)?Y.Escape.html(s):"");};BulkEditor.error_msg_markup=Y.Lang.sub('<div class="{c}"></div>',{c:message_container_class});BulkEditor.labelMarkup=function(o){var label='<label for="{id}">{label}</label>';return Y.Lang.sub(label,{id:this.getFieldId(o.record,o.key),label:o.field.label});};BulkEditor.markup={input:function(o){var input='<div class="{cont}{key}">'+"{label}{msg1}"+'<input type="text" id="{id}" value="{value}" class="{field}{key} {yiv}" />'+"{msg2}"+"</div>";var label=o.field&&o.field.label?BulkEditor.labelMarkup.call(this,o):"";return Y.Lang.sub(input,{cont:BulkEditor.field_container_class+" "+BulkEditor.field_container_class_prefix,field:BulkEditor.field_class_prefix,key:o.key,id:this.getFieldId(o.record,o.key),label:label,value:BulkEditor.cleanHTML(o.value),yiv:(o.field&&o.field.validation&&o.field.validation.css)||"",msg1:label?BulkEditor.error_msg_markup:"",msg2:label?"":BulkEditor.error_msg_markup});},select:function(o){var select='<div class="{cont}{key}">'+"{label}{msg1}"+'<select id="{id}" class="{field}{key}">{options}</select>'+"{msg2}"+"</div>";var option='<option value="{value}" {selected}>{text}</option>';var options=Y.Array.reduce(o.field.values,"",function(s,v){return s+Y.Lang.sub(option,{value:v.value,text:BulkEditor.cleanHTML(v.text),selected:o.value&&o.value.toString()===v.value?'selected="selected"':""});});var label=o.field&&o.field.label?BulkEditor.labelMarkup.call(this,o):"";return Y.Lang.sub(select,{cont:BulkEditor.field_container_class+" "+BulkEditor.field_container_class_prefix,field:BulkEditor.field_class_prefix,key:o.key,id:this.getFieldId(o.record,o.key),label:label,options:options,yiv:(o.field&&o.field.validation&&o.field.validation.css)||"",msg1:label?BulkEditor.error_msg_markup:"",msg2:label?"":BulkEditor.error_msg_markup});},checkbox:function(o){var checkbox='<div class="{cont}{key}">'+'<input type="checkbox" id="{id}" {value} class="{field}{key}" /> '+'<label for="{id}">{label}</label>'+"{msg}"+"</div>";var label=o.field&&o.field.label?BulkEditor.labelMarkup.call(this,o):"";return Y.Lang.sub(checkbox,{cont:BulkEditor.field_container_class+" "+BulkEditor.field_container_class_prefix,field:BulkEditor.field_class_prefix,key:o.key,id:this.getFieldId(o.record,o.key),label:label,value:o.value==o.field.values.on?'checked="checked"':"",msg:BulkEditor.error_msg_markup});},checkboxMultiselect:function(o){var select='<div class="{cont}{key}">'+"{label}{msg}"+'<div id="{id}-cbs" class="checkbox-multiselect">{cbs}</div>'+'<select id="{id}" class="{field}{key}" multiple="multiple" style="display:none;">{options}</select>'+"</div>";var id=this.getFieldId(o.record,o.key),has_value=Y.Lang.isArray(o.value);var checkbox='<p class="checkbox-multiselect-checkbox">'+'<input type="checkbox" id="{id}-{value}" value="{value}" {checked} /> '+'<label for="{id}-{value}">{label}</label>'+"</p>";var cbs=Y.Array.reduce(o.field.values,"",function(s,v){return s+Y.Lang.sub(checkbox,{id:id,value:v.value,checked:has_value&&Y.Array.indexOf(o.value,v.value)>=0?'checked="checked"':"",label:BulkEditor.cleanHTML(v.text)});});var option='<option value="{value}" {selected}>{text}</option>';var options=Y.Array.reduce(o.field.values,"",function(s,v){return s+Y.Lang.sub(option,{value:v.value,text:BulkEditor.cleanHTML(v.text),selected:has_value&&Y.Array.indexOf(o.value,v.value)>=0?'selected="selected"':""});});var label=o.field&&o.field.label?BulkEditor.labelMarkup.call(this,o):"";return Y.Lang.sub(select,{cont:BulkEditor.field_container_class+" "+BulkEditor.field_container_class_prefix,field:BulkEditor.field_class_prefix,key:o.key,id:id,label:label,cbs:cbs,options:options,yiv:(o.field&&o.field.validation&&o.field.validation.css)||"",msg:BulkEditor.error_msg_markup});},textarea:function(o){var textarea='<div class="{cont}{key}">'+"{label}{msg1}"+'<textarea id="{id}" class="satg-textarea-field {prefix}{key} {yiv}">{value}</textarea>'+"{msg2}"+"</div>";var label=o.field&&o.field.label?BulkEditor.labelMarkup.call(this,o):"";return Y.Lang.sub(textarea,{cont:BulkEditor.field_container_class+" "+BulkEditor.field_container_class_prefix,prefix:BulkEditor.field_class_prefix,key:o.key,id:this.getFieldId(o.record,o.key),label:label,value:BulkEditor.cleanHTML(o.value),yiv:(o.field&&o.field.validation&&o.field.validation.css)||"",msg1:label?BulkEditor.error_msg_markup:"",msg2:label?"":BulkEditor.error_msg_markup});}};BulkEditor.fieldMarkup=function(key,record){var field=this.getFieldConfig(key);return BulkEditor.markup[field.type||"input"].call(this,{key:key,value:record[key],field:field,record:record});
};function handleCheckboxMultiselect(e){var cb=e.currentTarget,value=cb.get("value"),select=cb.ancestor(".checkbox-multiselect").next("select");Y.some(Y.Node.getDOMNode(select).options,function(o){if(o.value==value){o.selected=cb.get("checked");return true;}});}Y.BulkEditor=BulkEditor;function HTMLTableBulkEditor(){HTMLTableBulkEditor.superclass.constructor.apply(this,arguments);}HTMLTableBulkEditor.NAME="htmltablebulkedit";HTMLTableBulkEditor.ATTRS={columns:{validator:Y.Lang.isObject,writeOnce:true},events:{validator:Y.Lang.isObject,writeOnce:true}};var cell_class=Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME,"cell"),cell_class_prefix=cell_class+"-",odd_class=Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME,"odd"),even_class=Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME,"even"),msg_class=Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME,"record-message"),liner_class=Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME,"liner");HTMLTableBulkEditor.inputFormatter=function(o){o.cell.set("innerHTML",BulkEditor.markup.input.call(this,o));};HTMLTableBulkEditor.textareaFormatter=function(o){o.cell.set("innerHTML",BulkEditor.markup.textarea.call(this,o));};HTMLTableBulkEditor.selectFormatter=function(o){o.cell.set("innerHTML",BulkEditor.markup.select.call(this,o));};HTMLTableBulkEditor.checkboxFormatter=function(o){o.cell.set("innerHTML",BulkEditor.markup.checkbox.call(this,o));};HTMLTableBulkEditor.checkboxMultiselectFormatter=function(o){o.cell.set("innerHTML",BulkEditor.markup.checkboxMultiselect.call(this,o));};HTMLTableBulkEditor.defaults={input:{formatter:HTMLTableBulkEditor.inputFormatter},select:{formatter:HTMLTableBulkEditor.selectFormatter},checkbox:{formatter:HTMLTableBulkEditor.checkboxFormatter},checkboxMultiselect:{formatter:HTMLTableBulkEditor.checkboxMultiselectFormatter},textarea:{formatter:HTMLTableBulkEditor.textareaFormatter}};function moveFocus(e){e.halt();var info=this.getRecordAndFieldKey(e.target);if(!info){return;}var bd=this.getRecordContainer(e.target);if(bd&&e.keyCode==38){bd=bd.previous();}else{if(bd){bd=bd.next();}}var id=bd&&this.getRecordId(bd);if(id){var field=this.getFieldElement(id,info.field_key);if(field){try{field.focus();field.select();}catch(ex){}}}}Y.extend(HTMLTableBulkEditor,BulkEditor,{bindUI:function(){},_renderContainer:function(container){var table_class=Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME);if(!this.table||container.get("firstChild").get("tagName").toLowerCase()!="table"||!container.get("firstChild").hasClass(table_class)){var s=Y.Lang.sub('<table class="{t}"><thead class="{hd}"><tr>',{t:table_class,hd:Y.ClassNameManager.getClassName(HTMLTableBulkEditor.NAME,"hd")});var row_markup='<th class="{cell} {prefix}{key}">{label}</th>';s=Y.Array.reduce(this.get("columns"),s,function(s,column){return s+Y.Lang.sub(row_markup,{cell:cell_class,prefix:cell_class_prefix,key:column.key,label:column.label||"&nbsp;"});});s+="</tr></thead></table>";container.set("innerHTML",s);this.table=container.get("firstChild");this._attachEvents(this.table);Y.on("key",moveFocus,this.table,"down:38,40+ctrl",this);Y.Object.each(this.get("events"),function(e){Y.delegate(e.type,e.fn,this.table,e.nodes,this);},this);}else{while(this.table.get("children").size()>1){this.table.get("lastChild").remove().destroy(true);}}},_renderRecordContainer:function(container,record){var body=Y.Node.create("<tbody></tbody>");body.set("id",this.getRecordContainerId(record));body.set("className",BulkEditor.record_container_class+" "+((this.table.get("children").size()%2)?odd_class:even_class));var msg_row=Y.Node.create("<tr></tr>");msg_row.set("className",BulkEditor.record_msg_container_class);var msg_cell=Y.Node.create("<td></td>");msg_cell.set("colSpan",this.get("columns").length);msg_cell.set("className",msg_class);msg_cell.set("innerHTML",BulkEditor.error_msg_markup);msg_row.appendChild(msg_cell);body.appendChild(msg_row);var row=Y.Node.create("<tr></tr>");body.appendChild(row);this.table.appendChild(body);return row;},_renderRecord:function(row,record){Y.Array.each(this.get("columns"),function(column){var key=column.key;var field=this.getFieldConfig(key);var cell=Y.Node.create("<td></td>");cell.set("className",cell_class+" "+cell_class_prefix+key);var liner=Y.Node.create("<div></div>");liner.set("className",liner_class);var f=null;if(Y.Lang.isFunction(column.formatter)){f=column.formatter;}else{if(field.type&&HTMLTableBulkEditor.defaults[field.type]){f=HTMLTableBulkEditor.defaults[field.type].formatter;}else{if(field.type){}f=HTMLTableBulkEditor.defaults.input.formatter;}}if(f){f.call(this,{cell:liner,key:key,value:record[key],field:field,column:column,record:record});}cell.appendChild(liner);row.appendChild(cell);},this);}});Y.HTMLTableBulkEditor=HTMLTableBulkEditor;},"@VERSION@",{requires:["widget","datasource-local","gallery-busyoverlay","gallery-formmgr-css-validation","gallery-node-optimizations","gallery-scrollintoview","array-extras","gallery-funcprog","escape","event-key","gallery-nodelist-extras2"],optional:["datasource","dataschema","gallery-paginator"],skinnable:true});