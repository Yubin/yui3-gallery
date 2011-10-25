YUI.add('gallery-io-multiresponse', function(Y) {

/**
 * <p>Extends the IO base class to enable multiple responses using an
 * iframe as the transport medium.</p>
 * 
 * @module io
 * @submodule io-multiresponse
 */

/**
 * <p>Extends the IO base class to enable multiple responses using an
 * iframe as the transport medium.  Each response fires the response event.
 * The only events that are fired are the start and end events.</p>
 * 
 * <p>All the YUI 3 IO features are supported, so the request can be sent
 * as either GET (for simple query args) or POST (for anything, even file
 * uploads).  The module uses an iframe to send the request and includes a
 * callback parameter.  (So you cannot include a parameter named
 * <q>callback</q>.)  For each response, the server must send a script
 * block invoking the callback, similar to JSONP.  Unlike JSONP, however,
 * requests can only be made to your own server because the callback will
 * reference <code>window.parent</code>.  In order to trigger script
 * parsing in all browsers, the first chunk of data that the server writes
 * to the connection must be at least 1024 bytes, and it must be part of
 * the body, so you will need to explicitly send an empty head.</p>
 * 
 * <p>Due to the way that the request data is parsed, it is not safe to
 * send JSON-encoded data using the standard YUI 3 IO methods.  However, if
 * you define <code>json</code> in the configuration passed to
 * <code>Y.io()</code>, then the data will be passed to the server under
 * the <code>json</code> parameter.  (If you pass an object, it will be
 * serialized with <code>Y.JSON.stringify()</code>.)
 * 
 * <p>To keep the iframe after it has finished loading, set
 * <code>debug:true</code> in the configuration passed to
 * <code>Y.io()</code>.</p>
 * 
 * @class io~multiresponse
 */

var L = Y.Lang,
    w = Y.config.win,
    d = Y.config.doc,
    _std = (d.documentMode && d.documentMode >= 8),
    _d = decodeURIComponent;

/**
 * Creates the iframe used in file upload transactions, and binds the
 * response event handler.
 *
 * @method _iframe
 * @private
 * @static
 * @param {object} o Transaction object generated by _iframe().
 * @param {object} c Configuration object passed to YUI.io().
 * @return {void}
 */
function _iframe(o, c, io) {
    var i = Y.Node.create('<iframe id="io-multi-response-' + o.id + '" name="io-multi-response-' + o.id + '" />');
        i._node.style.position = 'absolute';
        i._node.style.top = '-1000px';
        i._node.style.left = '-1000px';

    Y.one('body').appendChild(i);
    // Bind the onload handler to the iframe to detect the file upload response.
    Y.on("load", function() { io._multi_complete(o, c); }, '#io-multi-response-' + o.id);
}

/**
 * Creates a temporary form, if the caller doesn't provide one.
 *
 * @method _form
 * @private
 * @static
 * @param {object} c Configuration object passed to YUI.io().
 * @return {string} form id
 */
function _form(c) {
    var id = Y.guid('io-multi-response-form-'),
        f = Y.Node.create('<form id="' + id + '" name="' + id + '" />');
        f._node.style.position = 'absolute';
        f._node.style.top = '-1000px';
        f._node.style.left = '-1000px';

    Y.one('body').appendChild(f);
    return id;
}

Y.mix(Y.IO.prototype, {
    /**
     * Adds JSON encoded data to the form.
     * 
     * @method _addJSON
     * @private
     * @static
     * @param {object} f HTML form object.
     * @param {string|object} s The JSON data or object to serialize.
     * @return {array} created fields.
     */
    _addJSON: function(f, s) {
        if (!Y.Lang.isString(s)) {
            s = Y.JSON.stringify(s);
        }

        var el  = d.createElement('input');
        el.type = 'hidden';
        el.name = 'json';
        el.value = s;
        f.appendChild(el);
        Y.log('key: json and value: ' + s + ' added as form data.', 'info', 'io');

        return el;
    },

    /**
     * Sets the appropriate attributes and values to the HTML form, in
     * preparation of a file upload transaction.
     * 
     * @method _multi_setAttrs
     * @private
     * @static
     * @param {object} f HTML form object.
     * @param {object} id The Transaction ID.
     * @param {object} uri Qualified path to transaction resource.
     * @param {string} method POST or GET.
     * @return {void}
     */
    _multi_setAttrs: function(f, id, uri, method) {
        f.setAttribute('action', uri);
        f.setAttribute('method', method || 'POST');
        f.setAttribute('target', 'io-multi-response-' + id );
        f.setAttribute(Y.UA.ie && !_std ? 'encoding' : 'enctype', 'multipart/form-data');
    },

    /**
     * Starts timeout count if the configuration object has a defined
     * timeout property.
     *
     * @method _multi_startTimeout
     * @private
     * @static
     * @param {object} o Transaction object generated by _iframe().
     * @param {object} c Configuration object passed to YUI.io().
     * @return {void}
     */
    _multi_startTimeout: function(o, c) {
        var io = this;

        io._timeout[o.id] = w.setTimeout(
            function() {
                o.status = 0;
                o.statusText = 'timeout';
                io.end(o, c);
                Y.log('Transaction ' + o.id + ' timeout.', 'info', 'io');
            }, c.timeout);
    },

    // reuse _clearTimeout()

    /**
     * Destroy the iframe and temp form, if any.
     * 
     * @method _multi_destroy
     * @private
     * @static
     * @param {number} id Transaction id.
     * @param {object} c Configuration object for the transaction.
     * @return {void}
     */
    _multi_destroy: function(id, c) {
        if (!c.debug) {
            Y.Event.purgeElement('#io-multi-response-' + id, false);
            Y.one('body').removeChild(Y.one('#io-multi-response-' + id));
            Y.log('The iframe for transaction ' + id + ' has been destroyed.', 'info', 'io');
        }

        if (c.form.id.indexOf('io-multi-response-form-') === 0) {
            Y.one('body').removeChild(Y.one('#' + c.form.id));
            Y.log('The temporary form for transaction ' + id + ' has been destroyed.', 'info', 'io');
        }
    },

    /**
     * Bound to the iframe's Load event and processes the response data.
     * 
     * @method _multi_complete
     * @private
     * @static
     * @param {o} o The transaction object
     * @param {object} c Configuration object for the transaction.
     * @return {void}
     */
    _multi_complete: function(o, c) {
        var io = this;

        if (c.timeout) {
            io._clearTimeout(o.id);
        }

        io.end(o, c);
        // The transaction is complete, so call _multi_destroy to remove
        // the event listener bound to the iframe, and then
        // destroy the iframe.
        w.setTimeout( function() { io._multi_destroy(o.id, c); }, 0);
    },

    /**
     * Uploads HTML form data, inclusive of files/attachments, using the
     * iframe created in _iframe to facilitate the transaction.
     * 
     * @method _multi_send
     * @private
     * @static
     * @param {o} o The transaction object
     * @param {object} uri Qualified path to transaction resource.
     * @param {object} c Configuration object for the transaction.
     * @return {void}
     */
    _multi_send: function(o, uri, c) {
        var io = this,
            f = (typeof c.form.id === 'string') ? d.getElementById(c.form.id) : c.form.id,
            // Track original HTML form attribute values.
            attr = {
                method: f.getAttribute('method'),
                action: f.getAttribute('action'),
                target: f.getAttribute('target')
            },
            fields = [];

        // Initialize the HTML form properties in case they are
        // not defined in the HTML form.
        io._multi_setAttrs(f, o.id, uri, c.method);
        if (c.data) {
//            var data = c.data;
//            if (L.isObject(data)) {	// bug in 3.4.0: does not auto-stringify for file upload
//                data = Y.QueryString.stringify(data);
//            }
            fields = io._addData(f, c.data);
        }
        if (c.json) {
            fields.push(io._addJSON(f, c.json));
        }

        // Start polling if a callback is present and the timeout
        // property has been defined.
        if (c.timeout) {
            io._multi_startTimeout(o, c);
            Y.log('Transaction timeout started for transaction ' + o.id + '.', 'info', 'io');
        }

        // Start file upload.
        f.submit();
        io.start(o, c);
        if (c.data) {
            io._removeData(f, fields);
        }
        // Restore HTML form attributes to their original values.
        io._resetAttrs(f, attr);

        return {
            id: o.id,
            abort: function() {
                o.status = 0;
                o.statusText = 'abort';
                if (Y.one('#io-multi-response-' + o.id)) {
                    io._multi_destroy(o.id, c);
                    io.end(o, c);
                    Y.log('Transaction ' + o.id + ' aborted.', 'info', 'io');
                }
                else {
                    Y.log('Attempted to abort transaction ' + o.id + ' but transaction has completed.', 'warn', 'io');
                    return false;
                }
            },
            isInProgress: function() {
                return Y.one('#io-multi-response-' + o.id) ? true : false;
            },
            io: io
        };
    }
});

var orig_init = Y.IO.prototype._init;

Y.IO.prototype._init = function(c) {
    orig_init.apply(this, arguments);

    this.publish('io:response', Y.merge({ broadcast: 1 }, c));
    this.publish('io-trn:response', c);
};

var orig_upload = Y.IO.prototype.upload;

/* @param {object} o - transaction object.
 * @param {string} uri - qualified path to transaction resource.
 * @param {object} c - configuration object for the transaction.
 * @return object
 */
Y.IO.prototype.upload = function(o, uri, c) {
    if (!c.multiresponse) {
        return orig_upload.apply(this, arguments);
    }

    var io = this;
    YUI.Env.io_multi_response_callback[ o.id ] = function(data) {
        if (!data) {
            Y.error('Callback ' + o.id + ' invoked without data.', null, 'io');
            return;
        }

        // reset timeout
        if (c.timeout) {
            io._clearTimeout(o.id);
            io._multi_startTimeout(o, c);
        }

        if (c.on && c.on.response) {
            o.c = data;
            io._evt('response', o, c);
        }
    };

    var callback_value = encodeURIComponent('window.parent.YUI.Env.io_multi_response_callback[' + o.id + ']');
    var callback_arg   = 'callback=' + callback_value;
    if (!c.data) {
        c.data = callback_arg;
    }
    else if (L.isObject(c.data)) {
        c.data.callback = callback_value;
    }
    else {
        c.data = c.data + '&' + callback_arg;
    }

    if (c.form && !c.form.id) {
        delete c.form;
    }

    _iframe(o, c, io);
    return io._multi_send(o, uri, c);
};

if (!YUI.Env.io_multi_response_callback)
{
    YUI.Env.io_multi_response_callback = [];
}

var orig_io = Y.io;

/* @param {string} uri - qualified path to transaction resource.
 * @param {object} c - configuration object for the transaction.
 * @return object
 */
Y.io = function(uri, c) {
    if (c.multiresponse && !c.form) {
        c.form = {
            id:     _form(c),
            upload: true
        };
    }
    else if (c.multiresponse && !c.form.upload) {
        c.form.upload = true;
    }

    orig_io.call(this, uri, c);
};

Y.mix(Y.io, orig_io);


}, '@VERSION@' ,{requires:['io-upload-iframe'], optional:['json-stringify']});
