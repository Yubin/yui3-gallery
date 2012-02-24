"use strict";

var has_no_recalc_auto_bug    = (0 < Y.UA.ie && Y.UA.ie < 8),
	has_explosive_modules_bug = (0 < Y.UA.ie && Y.UA.ie < 8),
	is_borked_dom_access      = (0 < Y.UA.ie && Y.UA.ie < 8);

/**
 * PageLayout plugin for managing vertically stacked rows on a page,
 * sandwiched vertically between header and footer.  Each row contains one
 * or more modules.
 * 
 * @module gallery-layout
 * @submodule gallery-layout-rows
 */

Y.namespace('PageLayoutRows');

// must be done after defining Y.PageLayoutRows

Y.PageLayoutRows.collapse_classes =
{
	vert_parent_class:       Y.PageLayout.module_rows_class,
	horiz_parent_class:      Y.PageLayout.module_class,
	collapse_parent_pattern: Y.PageLayout.expand_vert_nub_class
};

function adjustHeight(
	/* int */		total_height,
	/* object */	children)
{
	var h = total_height;

	if (is_borked_dom_access)
	{
		var access_dom_so_it_will_be_right_next_time = children.bd.get('offsetHeight');
	}

	var b = children.root.get('offsetHeight') - children.bd.get('offsetHeight');

	if (children.hd)
	{
		h -= children.hd.get('offsetHeight');
		b -= children.hd.get('offsetHeight');
	}
	if (children.ft)
	{
		h -= children.ft.get('offsetHeight');
		b -= children.ft.get('offsetHeight');
	}

	h -= b;

	h -= children.bd.vertMarginBorderPadding();

	return Math.max(h, Y.PageLayout.min_module_height);
}

function getWidth(
	/* int */		body_width,
	/* array */		col_widths,
	/* int */		row_index,
	/* int */		col_index,
	/* object */	module,
	/* object */	module_info)
{
	module_info.mbp = module.horizMarginBorderPadding();
	return Math.max(1, Math.floor(body_width * col_widths[ row_index ][ col_index ] / 100.0) - module_info.mbp);
}

Y.PageLayoutRows.resize = function(host)
{
	if (!host.body_container)
	{
		return;
	}

	var mode = host.get('mode');

	host.body_container.setStyle('overflowX',
		mode === Y.PageLayout.FIT_TO_CONTENT ? 'auto' : 'hidden');
	host.body_container.setStyle('overflowY',
		mode === Y.PageLayout.FIT_TO_CONTENT ? 'scroll' : 'hidden');

	var viewport =
	{
		w: host.body_container.get('winWidth'),
		h: host.body_container.get('winHeight')
	};

	var resize_event = arguments[0] && arguments[0].type == 'resize';	// IE7 generates no-op's
	if (resize_event &&
		(viewport.w === host.viewport.w &&
		 viewport.h === host.viewport.h))
	{
		return;
	}

	host.viewport = viewport;

	host.fire('beforeReflow');	// after confirming that viewport really has changed

	var min_width  = host.get('minWidth') * Y.Node.emToPx();
	var body_width = Math.max(host.viewport.w, min_width);
	if (host.header_container)
	{
		host.header_container.setStyle('width', body_width+'px');
	}
	host.body_container.setStyle('width', (body_width - host.body_horiz_mbp)+'px');
	if (host.footer_container)
	{
		host.footer_container.setStyle('width', host.get('stickyFooter') ? body_width+'px' : 'auto');
	}
	body_width = host.body_container.get('clientWidth') - host.body_horiz_mbp;

	host.viewport.bcw = host.body_container.get('clientWidth');

	var h     = host.viewport.h;
	var h_min = host.get('minHeight') * Y.Node.emToPx();
	if (mode === Y.PageLayout.FIT_TO_VIEWPORT && h < h_min)
	{
		h = h_min;
		Y.one(document.documentElement).setStyle('overflowY', 'auto');
	}
	else if (!window.console || !window.console.layout_force_viewport_scrollbars)	// remove inactive vertical scrollbar in IE
	{
		Y.one(document.documentElement).setStyle('overflowY', 'hidden');
	}

	if (host.header_container)
	{
		h -= host.header_container.get('offsetHeight');
	}
	if (host.footer_container &&
		(mode === Y.PageLayout.FIT_TO_VIEWPORT || host.get('stickyFooter')))
	{
		h -= host.footer_container.get('offsetHeight');
	}

	if (mode === Y.PageLayout.FIT_TO_VIEWPORT)
	{
		var body_height = h - host.body_vert_mbp;
	}
	else if (h < 0)							// FIT_TO_CONTENT doesn't enforce min height
	{
		h = 10 + host.body_vert_mbp;		// arbitrary, positive number
	}

	host.body_container.setStyle('height', (h - host.body_vert_mbp)+'px');

	var row_count = host.body_rows.rows.size();

	// reset module heights
	// adjust for horizontally collapsed or fixed width modules

	var col_widths = [],
		row_widths = [];
	for (var i=0; i<row_count; i++)
	{
		var widths = host.body_rows.col_widths[i].slice(0);
		col_widths.push(widths);
		row_widths.push(body_width);

		var uncollapsed_count = 0,
			sum               = 0;

		var modules = host.body_rows.modules[i];
		var count   = modules.size();
		for (var j=0; j<count; j++)
		{
			var module = modules.item(j);
			module.setStyle('height', 'auto');
			if (module.hasClass(Y.PageLayout.collapsed_horiz_class))
			{
				if (has_no_recalc_auto_bug)
				{
					module.setStyle('display', 'none');
				}
				module.setStyle('width', 'auto');
				if (has_no_recalc_auto_bug)
				{
					module.setStyle('display', 'block');
				}
				widths[j]      = - module.get('offsetWidth');
				row_widths[i] -= module.totalWidth();
			}
			else if (widths[j] > 0)
			{
				uncollapsed_count++;
				sum += widths[j];
			}
		}

		if (uncollapsed_count < count)
		{
			for (var j=0; j<count; j++)
			{
				if (widths[j] > 0)
				{
					widths[j] *= (100.0 / sum);
				}
			}
		}
	}

	// fit-to-content:  compute height of each row; requires setting module widths
	// fit-to-viewport: adjust for vertically collapsed modules

	var module_info = {};
	if (mode === Y.PageLayout.FIT_TO_CONTENT)
	{
		var row_heights = [];
		for (var i=0; i<row_count; i++)
		{
			host.body_rows.rows.item(i).setStyle('height', 'auto');

			var modules    = host.body_rows.modules[i];
			var h          = 0;
			var total_w    = 0;
			var open_count = modules.size();
			var count      = open_count;
			for (var j=0; j<count; j++)
			{
				var w      = col_widths[i][j];
				var module = modules.item(j);
				if (w < 0)
				{
					var total_w_hacked = false;
					if (w == Y.PageLayout.unmanaged_size && has_explosive_modules_bug)
					{
						var children = host._analyzeModule(module);
						if (children.bd)
						{
							var bd_w = children.bd.totalWidth();
							total_w += bd_w + module.horizMarginBorderPadding();
							total_w_hacked = true;

							children.root.setStyle('width', bd_w+'px');
						}
					}

					if (!total_w_hacked)
					{
						total_w += module.totalWidth();
					}
					open_count--;
				}
			}

			var k = 0;
			for (var j=0; j<count; j++)
			{
				var w      = col_widths[i][j];
				var module = modules.item(j);
				if (w < 0)
				{
					if (w == Y.PageLayout.unmanaged_size)
					{
						var children = host._analyzeModule(module);
						if (children.bd)
						{
							children.root.setStyle('height', 'auto');
							children.bd.setStyle('height', 'auto');
						}

						h = Math.max(h, module.get('offsetHeight'));
					}
					continue;
				}
				k++;

				var children = host._analyzeModule(module);
				if (children.bd)
				{
					var w    = getWidth(row_widths[i], col_widths, i, j, module, module_info);
					total_w += w + module_info.mbp;

					if (k == open_count)
					{
						w += body_width - total_w;
					}

					var w1 = Math.max(1, w - children.bd.horizMarginBorderPadding());
					host.fire('beforeResizeModule', children.bd, 'auto', w1);
					host._setWidth(children, w);
					children.root.setStyle('height', 'auto');
					children.bd.setStyle('height', 'auto');
				}

				h = Math.max(h, module.get('offsetHeight'));
			}

			row_heights.push(h);
		}
	}
	else
	{
		var row_heights = host.body_rows.row_heights.slice(0);

		var uncollapsed_count = 0,
			sum               = 0;
		for (var i=0; i<row_count; i++)
		{
			var row       = host.body_rows.rows.item(i);
			var collapsed = row.hasClass(Y.PageLayout.collapsed_vert_class);
			if (collapsed || row_heights[i] < 0)
			{
				row_heights[i] = 0;
				if (collapsed)
				{
					row.setStyle('height', 'auto');
				}

				// We cannot compute the height of row directly
				// because the row above might be wrapping.

				body_height -= row.one('*').totalHeight();
				body_height -= row.vertMarginBorderPadding();
			}
			else
			{
				uncollapsed_count++;
				sum += row_heights[i];
			}
		}

		if (uncollapsed_count < row_count)
		{
			for (var i=0; i<row_count; i++)
			{
				row_heights[i] *= (100.0 / sum);
			}
		}
	}

	// set height of each row and size of each module

	for (var i=0; i<row_count; i++)
	{
		if (mode === Y.PageLayout.FIT_TO_CONTENT)
		{
			var h = row_heights[i];
		}
		else
		{
			if (row_heights[i] === 0)
			{
				var module   = host.body_rows.modules[i].item(0);
				var children = host._analyzeModule(module);
				if (children.bd)
				{
					var h1 = children.bd.insideHeight();
					var w  = getWidth(row_widths[i], col_widths, i, 0, module, module_info);
					var w1 = Math.max(1, w - children.bd.horizMarginBorderPadding());
					host.fire('beforeResizeModule', children.bd, h1, w1);
					host._setWidth(children, w);
					host.fire('afterResizeModule', children.bd, h1, w1);
				}
				continue;
			}

			var h = Math.max(1, Math.floor(body_height * row_heights[i] / 100.0) - host.body_rows.rows.item(i).vertMarginBorderPadding());
		}
		host.body_rows.rows.item(i).setStyle('height', h+'px');

		// adjust for horizontally collapsed or fixed width modules

		var modules    = host.body_rows.modules[i];
		var total_w    = 0;
		var open_count = modules.size();
		var count      = open_count;
		for (var j=0; j<count; j++)
		{
			var w      = col_widths[i][j];
			var module = modules.item(j);
			if (w < 0)
			{
				var total_w_hacked = false;
				if (w == Y.PageLayout.unmanaged_size)
				{
					var children = host._analyzeModule(module);
					if (children.bd)
					{
						var h1 = adjustHeight(h, children);
						var w1 = children.bd.insideWidth();
						host.fire('beforeResizeModule', children.bd, h1, w1);
						children.bd.setStyle('height', h1+'px');

						if (has_explosive_modules_bug)
						{
							var bd_w = children.bd.totalWidth();
							total_w += bd_w + module.horizMarginBorderPadding();
							total_w_hacked = true;

							children.root.setStyle('width', bd_w+'px');
						}

						host.fire('afterResizeModule', children.bd, h1, w1);
					}
				}
				else
				{
					module.setStyle('height', Math.max(1, h - module.vertMarginBorderPadding())+'px');
				}

				if (!total_w_hacked)
				{
					total_w += module.totalWidth();
				}
				open_count--;
			}
		}

		// set the size of each module

		var k = 0;
		for (var j=0; j<count; j++)
		{
			if (col_widths[i][j] < 0)
			{
				continue;
			}
			k++;

			var module   = modules.item(j);
			var children = host._analyzeModule(module);
			if (children.bd)
			{
				var h1   = adjustHeight(h, children);
				var w    = getWidth(row_widths[i], col_widths, i, j, module, module_info);
				total_w += w + module_info.mbp;

				if (k == open_count)
				{
					w += body_width - total_w;
				}

				var w1 = Math.max(1, w - children.bd.horizMarginBorderPadding());
				if (mode === Y.PageLayout.FIT_TO_VIEWPORT)
				{
					host.fire('beforeResizeModule', children.bd, h1, w1);
					host._setWidth(children, w);
				}

				children.bd.setStyle('height', h1+'px');

				host.fire('afterResizeModule', children.bd, h1, w1);
			}
		}
	}

	host.body_container.setStyle('visibility', 'visible');
	if (host.footer_container)
	{
		host.footer_container.setStyle('visibility', 'visible');
	}

	Y.Lang.later(100, host, host._checkViewportSize);
};
