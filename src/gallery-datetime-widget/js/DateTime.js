"use strict";

var Dom = YAHOO.util.Dom,
	SDom = YAHOO.SATG.Dom,
	Event = YAHOO.util.Event,

var blackout_min_seconds = -40,
	blackout_max_seconds = +40,
	change_after_focus = (0 < YAHOO.env.ua.ie);

/**
 * @module gallery-datetime
 */

/**********************************************************************
 * Manages an optional set of radio buttons (for "no date", etc.), a date
 * input field + hour and minute menus, a calendar for selecting the date
 * (either inline or as a popup tied to the date input field), and a legend
 * explaining the ways in which a day can be marked, based on blackouts.
 * 
 * Date/time values can be specified as either a Date object or an object
 * specifying year,month,day (all 1-based) or date_str and optionally
 * hour,minute or time_str.  Individual values take precedence over string
 * values.  Time resolution is in minutes.
 * 
 * @main gallery-datetime
 * @class DateTime
 * @extends Widget
 * @constructor
 * @param config {Object}
 */

function DateTime = function(config)
{
	DateTime.superclass.constructor.apply(this, arguments);
};

DateTime.NAME = "datetime";

function isInputNode(n)
{
	// allow Y.Node from a different sandbox
	return n && n._node && n._node.tagName == 'INPUT';
}

DateTime.ATTRS =
{
	/**
	 * Date input field to use.  Can be augmented with a Calendar via
	 * gallery-input-calendar-sync.
	 * 
	 * @attribute calendar
	 * @type {Calendar}
	 * @required
	 * @writeonce
	 */
	dateInput:
	{
		validator: isInputNode,
		writeOnce: true
	},

	/**
	 * Time input field to use.  Can be enhanced with gallery-timepicker.
	 * 
	 * @attribute timeInput
	 * @type {Node}
	 * @required
	 * @writeonce
	 */
	timeInput:
	{
		validator: isInputNode,
		writeOnce: true
	},

	/**
	 * Blackout ranges, specified as a list of objects, each defining start
	 * and end.
	 * 
	 * @attribute blackout
	 * @type {Array}
	 * @default []
	 */
	blackouts:
	{
		value:     [],
		validator: Y.Lang.isArray,
		setter: function(ranges)
		{
			// store ranges in ascending order of start time

			blackout   = [];
			blank_time = this.get('blank_time');
			for (var i=0; i<ranges.length; i++)
			{
				var r   = ranges[i];
				r.start = DateTime.normalize(r.start, blank_time);
				r.end   = DateTime.normalize(r.end,   blank_time);

				r =
				[
					new Date(r.start.year, r.start.month-1, r.start.day,
							 r.start.hour, r.start.minute, blackout_min_seconds)
							 .getTime(),
					new Date(r.end.year, r.end.month-1, r.end.day,
							 r.end.hour, r.end.minute, blackout_max_seconds)
							 .getTime()
				];

				var inserted = false;
				for (var j=0; j<blackout.length; j++)
				{
					var r1 = blackout[j];
					if (r[0] <= r1[0])
					{
						if (j > 0 &&
							r[0] <  blackout[j-1][1] &&
							r[1] <= blackout[j-1][1])
						{
							// covered by prev
						}
						else if (j > 0 &&
								 r[0] - 60000 < blackout[j-1][1] &&
								 r1[0] < r[1] + 60000)
						{
							// overlaps prev and next
							r = [ blackout[j-1][0], r[1] ];
							blackout.splice(j-1, 2, r);
						}
						else if (j > 0 &&
								 r[0] - 60000 < blackout[j-1][1])
						{
							// overlaps prev
							blackout[j-1][1] = r[1];
						}
						else if (r1[0] < r[1] + 60000)
						{
							// overlaps next
							r1[0] = r[0];
						}
						else
						{
							blackout.splice(j, 0, r);
						}
						inserted = true;
						break;
					}
				}

				// j == blackout.length

				if (!inserted && j > 0 &&
					r[0] <  blackout[j-1][1] &&
					r[1] <= blackout[j-1][1])
				{
					// covered by prev
				}
				else if (!inserted && j > 0 &&
						 r[0] - 60000 < blackout[j-1][1])
				{
					// overlaps prev
					blackout[j-1][1] = r[1];
				}
				else if (!inserted)
				{
					blackout.push(r);
				}
			}

			return blackout;
		}
	},

	/**
	 * The direction to push the selected date and time when the user
	 * selects a day with partial blackout.
	 *
	 * @attribute blackoutSnapDirection
	 * @type {-1,+1}
	 * @default +1
	 */
	blackoutSnapDirection:
	{
		default: +1,
		validator: function(value)
		{
			return (value == -1 || value == +1);
		}
	}
}

function handleCalendarSelection()
{
	if (!this.ignore_date_selection)
	{
		this.rb[ this.rb.length-1 ].checked = true;
		this._updateDisplay();

		if (this.hour_menu.selectedIndex == -1 ||
			this.minute_menu.selectedIndex == -1)
		{
			this.hour_menu.value   = this.blank_time.hour;
			this.minute_menu.value = this.blank_time.minute;
		}

		this.ping_input = this.should_ping_input;
		enforceDateTimeLimits.call(this, 'same-day');
	}
}

function handleRadioSelection(e)
{
	this._updateDisplay();

	if (Y.Lang.isArray(this.rb_hook))
	{
		var i = this.rb.indexOf(e.target);
		if (i >= 0)
		{
			applyRadioHook.call(this, i);
		}
	}
}

function applyRadioHook(
	/* int */	index)
{
	if (!Y.Lang.isArray(this.rb_hook))
	{
		return;
	}

	this.skip_select_hook = true;

	try
	{
		var hook = this.rb_hook[index];
		if (Y.Lang.isFunction(hook))
		{
			hook.call(this);
		}
		else if (Y.Lang.isString(hook))
		{
			this[hook].call(this);
		}
		else if (hook && hook.fn)
		{
			var scope = hook.scope || this;
			hook.fn.apply(scope, hook.args);
		}
	}
	catch(e)
	{
		throw e;
	}
	finally
	{
		this.skip_select_hook = false;
	}
}

function selectHook(
	/* string */	name)
{
	if (this.skip_select_hook ||
		!Y.Lang.isArray(this.rb_hook))
	{
		return;
	}

	var i = Y.Array.findIndexOf(this.rb_hook, function(hook)
	{
		return ((Y.Lang.isFunction(hook) && hook == this[name]) ||
				(Y.Lang.isString(hook) && hook == name));
	},
	this);

	if (i >= 0)
	{
		this.rb.item(i).set('checked', true);
		this._updateDisplay();
	}
}

function enforceDateTimeLimits(
	/* string */	algo)
{
	var date = this.calendar.getDate();
	if (!date)
	{
		return;
	}

	date.setHours(parseInt(this.hour_menu.value, 10));
	date.setMinutes(parseInt(this.minute_menu.value, 10));
	date.setSeconds(0);
	date.setMilliseconds(0);
	var orig_date = new Date(date.getTime());

	// blackout ranges

	if (this.blackout.length > 0)
	{
		var t      = date.getTime(),
			orig_t = t,
			snap   = this.get('blackoutSnapDirection');

		for (var i=0; i<this.blackout.length; i++)
		{
			var blackout = this.blackout[i];
			if (blackout[0] < t && t < blackout[1])
			{
				if (snap > 0)
				{
					t = blackout[1] + 60000;
				}
				else
				{
					t = blackout[0];
				}

				if (algo == 'same-day')
				{
					var tmp = new Date(t);
					if (tmp.getDate()     != date.getDate()  ||
						tmp.getMonth()    != date.getMonth() ||
						tmp.getFullYear() != date.getFullYear())
					{
						t = snap > 0 ? blackout[0] : blackout[1] + 60000;
					}
				}

				break;
			}
		}

		if (t != orig_t)
		{
			date = new Date(t);
		}
	}

	// min/max last, shrink inward if blackout dates extend outside [min,max] range

	if (this.min_date_time)
	{
		var t = this.min_date_time.date.getTime();

		if (this.blackout.length > 0)
		{
			var orig_t = t;
			var i      = 0;
			while (i < this.blackout.length && this.blackout[i][0] < t)
			{
				t = Math.max(orig_t, this.blackout[i][1]);
				i++;
			}
		}

		if (date.getTime() < t)
		{
			date = new Date(t);
		}
	}

	if (this.max_date_time)
	{
		var t = this.max_date_time.date.getTime();

		if (this.blackout.length > 0)
		{
			var orig_t = t;
			var i      = this.blackout.length - 1;
			while (i >= 0 && t < this.blackout[i][1])
			{
				t = Math.min(orig_t, this.blackout[i][0]);
				i--;
			}
		}

		if (t < date.getTime())
		{
			date = new Date(t);
		}
	}

	// update controls that changed

	var pings = [];
	if (this.ping_input)
	{
		pings.push(this.input);
	}

	if (date.getFullYear() !== orig_date.getFullYear() ||
		date.getMonth()    !== orig_date.getMonth()    ||
		date.getDate()     !== orig_date.getDate())
	{
		this.calendar.setDate(date);
		this.hour_menu.value   = date.getHours();
		this.minute_menu.value = date.getMinutes();
		this._ping(this.input, this.hour_menu, this.minute_menu);
	}
	else if (date.getHours() !== orig_date.getHours())
	{
		this.hour_menu.value   = date.getHours();
		this.minute_menu.value = date.getMinutes();
		this._ping.apply(this, pings.concat(this.hour_menu, this.minute_menu));
	}
	else if (date.getMinutes() !== orig_date.getMinutes())
	{
		this.minute_menu.value = date.getMinutes();
		this._ping.apply(this, pings.concat(this.minute_menu));
	}
	else if (pings.length > 0)
	{
		this._ping.apply(this, pings);
	}

	this.fire('limitsEnforced');
}

function updateRendering()
{
	if (this.disabled)
	{
		return;
	}

	this.calendar.calendar.removeRenderers();

	var blackouts = this.blackout.slice(0);

	if (this.min_date_time)
	{
		if (blackouts.length > 0)
		{
			var t       = this.min_date_time.date.getTime();
			var changed = false;
			for (var i=0; i < blackouts.length; i++)
			{
				var blackout = blackouts[i];
				if (blackout[1] <= t)
				{
					blackouts.shift();
					i--;
				}
				else if (blackout[0] < t)
				{
					var start = new Date(blackout[0]);
					start.setHours(0);
					start.setMinutes(0);
					start.setSeconds(blackout_min_seconds);
					blackouts[i] = [ start.getTime(), blackout[1] ];
					changed      = true;
					break;
				}
			}
		}

		if (!changed &&
			(this.min_date_time.hour > 0 || this.min_date_time.minute > 0))
		{
			this.calendar.calendar.addRenderer(
				DateTime.formatDate(this.min_date_time.date),
				cellRenderer('satg-partial-blackout'));
		}
	}

	if (this.max_date_time)
	{
		if (blackouts.length > 0)
		{
			var t       = this.max_date_time.date.getTime();
			var changed = false;
			for (var i=blackouts.length-1; i>=0; i--)
			{
				var blackout = blackouts[i];
				if (t <= blackout[0])
				{
					blackouts.pop();
				}
				else if (t < blackout[1])
				{
					var end = new Date(blackout[1]);
					end.setHours(23);
					end.setMinutes(59);
					end.setSeconds(blackout_max_seconds);
					blackouts[i] = [ blackout[0], end.getTime() ];
					changed      = true;
					break;
				}
			}
		}

		if (!changed &&
			(this.max_date_time.hour < 23 || this.max_date_time.minute < 59))
		{
			this.calendar.calendar.addRenderer(
				DateTime.formatDate(this.max_date_time.date),
				cellRenderer('satg-partial-blackout'));
		}
	}

	for (var i=0; i<blackouts.length; i++)
	{
		var blackout = blackouts[i];
		var start    = new Date(blackout[0] + blackout_max_seconds*1000);
		var end      = new Date(blackout[1] + blackout_min_seconds*1000);

		if (start.getHours() > 0 || start.getMinutes() > 0)
		{
			this.calendar.calendar.addRenderer(
				DateTime.formatDate(start),
				cellRenderer('satg-partial-blackout'));
			start.setDate(start.getDate()+1);
			start.setHours(0);
		}

		if (end.getHours() < 23 || end.getMinutes() < 59)
		{
			this.calendar.calendar.addRenderer(
				DateTime.formatDate(end),
				cellRenderer('satg-partial-blackout'));
			end.setDate(end.getDate()-1);
			end.setHours(23);
		}

		if (start.getTime() < end.getTime())
		{
			var s = DateTime.formatDate(start),
				e = DateTime.formatDate(end);
			if (s != e)
			{
				s += YAHOO.SATG.Locale.Calendar.YUI_DATE_RANGE_DELIMITER + e;
			}

			this.calendar.calendar.addRenderer(
				s, this.calendar.calendar.renderOutOfBoundsDate);
		}
	}

	this.calendar.render();
}

function cellRenderer(
	/* string */ css)
{
	return function(date, cell)
	{
		Dom.addClass(cell, css);
	};
}

YAHOO.lang.extend(DateTime, YAHOO.util.EventProvider,
{
	_init: function(
		/* object/string */	container,
		/* map */			config)
	{
		this.container = Dom.get(container);
		Dom.generateId(this.container);
		Dom.addClass(this.container, 'satg-date-time-container');

		if (!config.label)
		{
			config.label =
			[
				YAHOO.SATG.Locale.Calendar.date_time_label1,
				YAHOO.SATG.Locale.Calendar.date_time_label2
			];

			config.hook =
			[
				'clearDateTime',
				'resetDateTime'
			];
		}
		else if (config.label.length !== config.hook.length)
		{
			throw Error('DateTime requires that label and hook must have same length.');
		}

		this.blank_time = config.blank_time || { hour:0, minute:0 };

		this.min_date_time = config.min_date_time;
		if (this.min_date_time)
		{
			this.min_date_time = DateTime.normalize(this.min_date_time, this.blank_time);
		}

		this.max_date_time = config.max_date_time;
		if (this.max_date_time)
		{
			this.max_date_time = DateTime.normalize(this.max_date_time, this.blank_time);
		}

		this.default_date_time = config.default_date_time;
		if (this.default_date_time)
		{
			this.default_date_time = DateTime.normalize(this.default_date_time, this.blank_time);
		}

		this.ping_hilight_time = config.ping_hilight_time || SDom.visual_ping_timeout;

		// controls

		this.control_div           = document.createElement('div');
		this.control_div.className = 'satg-date-time-controls';
		this.control_div.innerHTML = this._controls(config);
		this.container.appendChild(this.control_div);

		var event = change_after_focus ? 'click' : 'change';

		this.rb = Dom.getElementsByClassName('satg-date-time-radio-field', 'input', this.control_div);
		Event.on(this.rb, event, handleRadioSelection, null, this);

		for (var i=0; i<this.rb.length; i++)
		{
			if (!config.label[i])	// remove from document so it doesn't disrupt keyboard navigation
			{
				this.rb[i].parentNode.removeChild(this.rb[i]);
			}
		}

		this.input       = Dom.getElementsByClassName('satg-date-time-date-field', 'input', this.control_div)[0];
		this.hour_menu   = Dom.getElementsByClassName('satg-date-time-hour-field', 'select', this.control_div)[0];
		this.minute_menu = Dom.getElementsByClassName('satg-date-time-minute-field', 'select', this.control_div)[0];

		this.no_time = config.no_time;
		this.rb_hook = config.hook;

		Event.on(this.hour_menu, 'change', enforceDateTimeLimits, null, this);
		Event.on(this.minute_menu, 'change', enforceDateTimeLimits, null, this);

		// calendar

		this.cal_div = document.createElement('div');
		this.container.appendChild(this.cal_div);

		this.calendar = new YAHOO.SATG.Calendar(this.cal_div,
		{
			input:        this.input,
			initial_date: config.default_date_time,
			min_date:     config.min_date_time,
			max_date:     config.max_date_time
		});

		if (!config.hide_legend)
		{
			this.legend_div           = document.createElement('div');
			this.legend_div.className = 'satg-date-time-legend';
			this.legend_div.innerHTML = dateTimeLegend();
			this.container.appendChild(this.legend_div);
		}

		// clear float

		if (!config.do_not_clear_float)
		{
			var hack       = document.createElement('div');
			hack.className = 'satg-calendar-post-float-clear';
			this.container.parentNode.appendChild(hack);
		}

		// initialize display

		if (config.allow_no_date_time && config.initial_mode)
		{
			this.rb[ config.initial_mode ].checked = true;
		}
		else if (config.allow_no_date_time)
		{
			this.first_rb_index = 0;
			for (var i=0; i<config.label.length; i++)
			{
				if (config.label[i])
				{
					this.first_rb_index = i;
					break;
				}
			}

			this.rb[ this.first_rb_index ].checked = true;
			config.initial_mode = this.first_rb_index;
		}
		else
		{
			var clazz = config.hide_no_date_class || SDom.hide_class;
			var el    = Dom.getElementsByClassName('satg-date-time-primary-fields', 'div', this.control_div)[0];
			Dom.addClass(el, clazz);
			this.rb[ this.rb.length-1 ].checked = true;
			config.initial_mode = this.rb.length-1;
		}

		if (config.allow_no_date_time)
		{
			Dom.addClass(this.container, 'satg-allow-no-date-time')
		}

		this.setDisabled(config.disabled);
		applyRadioHook.call(this, config.initial_mode);		// after _updateDisplay()

		// listen for changes

		this.calendar.subscribe('onInitSyncFinished', installDateTimeCalendarSelection, null, this);

		// black-out dates

		if (config.blackout_ranges)
		{
			this.setBlackoutRanges(config.blackout_ranges, true);
		}
		updateRendering.call(this);

		// done

		YAHOO.lang.later(1, this, function()
		{
			this.fire('init');
		});
	},

	destroy: function()
	{
		Event.purgeElement(this.control_div, true);
		this.calendar.destroy();

		var hack = SDom.getFirstSiblingByClassName(this.container, 'satg-calendar-post-float-clear');
		if (hack)
		{
			this.container.parentNode.removeChild(hack);
		}

		this.container.parentNode.removeChild(this.container);
		this.container   = null;
		this.cal_div     = null;
		this.control_div = null;
		this.rb          = null;
		this.input       = null;
		this.hour_menu   = null;
		this.minute_menu = null;
	},

	getDateTime: function()
	{
		if (this._controlsDisabled())
		{
			for (var i=0; i<this.rb.length; i++)
			{
				if (this.rb[i].checked)
				{
					return i;
				}
			}
			return false;	// should never happen
		}

		var date = this.calendar.getDate();
		if (!date)
		{
			return false;
		}

		var result =
		{
			year:   date.getFullYear(),
			month:  date.getMonth()+1,
			day:    date.getDate(),

			date_str: DateTime.formatDate(date)
		};

		if (!this.no_time)
		{
			result.hour     = parseInt(this.hour_menu.value, 10);
			result.minute   = parseInt(this.minute_menu.value, 10);
			result.time_str = DateTime.formatTime({ hour: this.hour_menu.value, minute: this.minute_menu.value });
		}

		return result;
	},

	setDateTime: function(
		/* object */	date_time)
	{
		this.rb[ this.rb.length-1 ].checked = true;
		this._updateDisplay();

		this.calendar.setDate(date_time);

		if (date_time instanceof Date)
		{
			this.hour_menu.value   = date_time.getHours();
			this.minute_menu.value = date_time.getMinutes();
		}
		else if (date_time.time_str)
		{
			var obj                = DateTime.parseTime(date_time.time_str);
			this.hour_menu.value   = obj.hour;
			this.minute_menu.value = obj.minute;
		}
		else
		{
			this.hour_menu.value   = date_time.hour;
			this.minute_menu.value = date_time.minute;
		}

		enforceDateTimeLimits.call(this);
	},

	resetDateTime: function()
	{
		if (this.default_date_time)
		{
			this.ignore_date_selection = true;
			this.calendar.setDate(this.default_date_time);
			this.ignore_date_selection = false;

			this.hour_menu.value   = this.default_date_time.hour;
			this.minute_menu.value = this.default_date_time.minute;
		}
		else
		{
			this.calendar.clearDate();

			this.hour_menu.value   = this.blank_time.hour;
			this.minute_menu.value = this.blank_time.minute;
		}

		selectHook.call(this, 'resetDateTime');
		enforceDateTimeLimits.call(this);
	},

	clearDateTime: function()
	{
		this.calendar.clearDate();
		this.hour_menu.selectedIndex   = -1;
		this.minute_menu.selectedIndex = -1;

		selectHook.call(this, 'clearDateTime');
	},

	setDefaultDateTime: function(
		/* object */	date_time)
	{
		this.default_date_time = date_time;
		if (this.default_date_time)
		{
			this.default_date_time = DateTime.normalize(this.default_date_time, this.blank_time);
		}
	},

	clearDefaultDateTime: function()
	{
		this.default_date_time = null;
	},

	setMinDateTime: function(
		/* object */	min)
	{
		if (min)
		{
			min = DateTime.normalize(min, this.blank_time);

			if (!this.min_date_time ||
				this.min_date_time.date.getTime() != min.date.getTime())
			{
				this.min_date_time = min;
				this.should_ping_input = true;
				this.calendar.setMinDate(this.min_date_time);
				enforceDateTimeLimits.call(this);
				this.should_ping_input = this.ping_input = false;

				updateRendering.call(this);
			}
		}
		else
		{
			this.clearMinDateTime();
		}
	},

	clearMinDateTime: function()
	{
		if (this.min_date_time)
		{
			this.min_date_time = null;
			this.calendar.clearMinDate();
			updateRendering.call(this);
		}
	},

	setMaxDateTime: function(
		/* object */	max)
	{
		if (max)
		{
			max = DateTime.normalize(max, this.blank_time);

			if (!this.max_date_time ||
				this.max_date_time.date.getTime() != max.date.getTime())
			{
				this.max_date_time = max;
				this.should_ping_input = true;
				this.calendar.setMaxDate(this.max_date_time);
				enforceDateTimeLimits.call(this);
				this.should_ping_input = this.ping_input = false;

				updateRendering.call(this);
			}
		}
		else
		{
			this.clearMaxDateTime();
		}
	},

	clearMaxDateTime: function()
	{
		if (this.max_date_time)
		{
			this.max_date_time = null;
			this.calendar.clearMaxDate();
			updateRendering.call(this);
		}
	},

	isDisabled: function()
	{
		return this.disabled;
	},

	setDisabled: function(
		/* bool */	disabled)
	{
		this.disabled = disabled;

		function always() { return true; }

		Dom.getElementsBy(always, 'input',  this.control_div, disableElement, disabled);
		Dom.getElementsBy(always, 'select', this.control_div, disableElement, disabled);

		this.calendar.setDisabled(disabled);

		updateRendering.call(this);
		this._updateDisplay();
	},

	setBlackoutRanges: function(
		/* array */	ranges,
		/* bool */	_skip_render)
	{

		// render blackouts

		if (!_skip_render)
		{
			updateRendering.call(this);
		}
	},

	_updateDisplay: function()
	{
		var disabled              = this._controlsDisabled();
		this.input.disabled       = disabled;
		this.hour_menu.disabled   = disabled;
		this.minute_menu.disabled = disabled;
	},

	_controlsDisabled: function()
	{
		return (this.disabled || !this.rb[ this.rb.length-1 ].checked);
	},

	_ping: function()
	{
		var nodes = Array.prototype.slice.call(arguments, 0);

		if (this.ping_task)
		{	
			Dom.removeClass([this.input, this.hour_menu, this.minute_menu], SDom.ping_class);
			this.ping_task.cancel();
			nodes = nodes.concat(this.ping_task.nodes);
		}

		Dom.addClass(nodes, SDom.ping_class);

		this.ping_task = YAHOO.lang.later(this.ping_hilight_time * 1000, this, function()
		{
			this.ping_task = null;
			Dom.removeClass(nodes, SDom.ping_class);
		});

		this.ping_task.nodes = nodes;
	},

	//
	// Markup
	//

	_controls: function(
		/* map */	config)
	{
		var radio_markup =
			'<div class="satg-date-time-control-row" style="{style}">' +
				'<input type="radio" name="{name}" id="{id}" value="{value}" class="satg-date-time-field satg-date-time-radio-field"/>' +
				'<label for="{id}" class="satg-date-time-label">{label}</label>' +
			'</div>';

		var markup =
			'<div class="satg-date-time-primary-fields">' +
				'{radio}' +
			'</div>' +
			'<div class="satg-date-time-secondary-fields">' +
				'<input type="text" class="satg-date-time-field satg-date-time-date-field"/>' +
				' ' +

				'<span style="{menu_style}">' +
					'<select class="satg-date-time-field satg-date-time-hour-field">' +
						'<option value="0">00</option><option value="1">01</option><option value="2">02</option><option value="3">03</option><option value="4">04</option>' +
						'<option value="5">05</option><option value="6">06</option><option value="7">07</option><option value="8">08</option><option value="9">09</option>' +
						'<option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option>' +
						'<option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option>' +
						'<option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option>' +
					'</select>' +
					' ' +

					'<select class="satg-date-time-field satg-date-time-minute-field">' +
						'<option value="0">00</option><option value="1">01</option><option value="2">02</option><option value="3">03</option><option value="4">04</option>' +
						'<option value="5">05</option><option value="6">06</option><option value="7">07</option><option value="8">08</option><option value="9">09</option>' +
						'<option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option>' +
						'<option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option>' +
						'<option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option>' +
						'<option value="25">25</option><option value="26">26</option><option value="27">27</option><option value="28">28</option><option value="29">29</option>' +
						'<option value="30">30</option><option value="31">31</option><option value="32">32</option><option value="33">33</option><option value="34">34</option>' +
						'<option value="35">35</option><option value="36">36</option><option value="37">37</option><option value="38">38</option><option value="39">39</option>' +
						'<option value="40">40</option><option value="41">41</option><option value="42">42</option><option value="43">43</option><option value="44">44</option>' +
						'<option value="45">45</option><option value="46">46</option><option value="47">47</option><option value="48">48</option><option value="49">49</option>' +
						'<option value="50">50</option><option value="51">51</option><option value="52">52</option><option value="53">53</option><option value="54">54</option>' +
						'<option value="55">55</option><option value="56">56</option><option value="57">57</option><option value="58">58</option><option value="59">59</option>' +
					'</select>' +
				'</span>' +
			'</div>';

		var radio_name = Dom.generateId();

		var radio = '';
		for (var i=0; i<config.label.length; i++)
		{
			radio += YAHOO.lang.substitute(radio_markup,
			{
				id:    Dom.generateId(),
				name:  radio_name,
				value: i,
				label: config.label[i] || '&nbsp;',
				style: config.label[i] ? '' : 'visibility:hidden;'
			});
		}

		return YAHOO.lang.substitute(markup,
		{
			radio:      radio,
			menu_style: config.no_time ? 'display:none;' : ''
		});
	}
});

function dateTimeLegend()
{
	var markup =
		'<div class="satg-partial-blackout satg-legend-icon"></div>' +
		'<p class="satg-legend-text">{label}</p>';

	return YAHOO.lang.substitute(markup,
	{
		label: YAHOO.SATG.Locale.Calendar.partial_day_legend
	});
}
