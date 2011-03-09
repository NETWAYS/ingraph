if ( ! String.prototype.format ) String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; ++i) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

/*
 * Cross browser size and position funcs.
 * thanks to http://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html
 */
function f_clientWidth() {
	return f_filterResults (
		window.innerWidth ? window.innerWidth : 0,
		document.documentElement ? document.documentElement.clientWidth : 0,
		document.body ? document.body.clientWidth : 0
	);
}
function f_clientHeight() {
	return f_filterResults (
		window.innerHeight ? window.innerHeight : 0,
		document.documentElement ? document.documentElement.clientHeight : 0,
		document.body ? document.body.clientHeight : 0
	);
}
function f_scrollLeft() {
	return f_filterResults (
		window.pageXOffset ? window.pageXOffset : 0,
		document.documentElement ? document.documentElement.scrollLeft : 0,
		document.body ? document.body.scrollLeft : 0
	);
}

function f_scrollTop() {
	return f_filterResults (
		window.pageYOffset ? window.pageYOffset : 0,
		document.documentElement ? document.documentElement.scrollTop : 0,
		document.body ? document.body.scrollTop : 0
	);
}

function f_filterResults(n_win, n_docel, n_body) {
	var n_result = n_win ? n_win : 0;
	if (n_docel && (!n_result || (n_result > n_docel)))
		n_result = n_docel;
	return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
}  

var iG = {};

iG.version = {
    major: 0,
    minor: 1
};

iG.config = {
    borderWidth	: 10,
    plot		: 0.75,
    legend		: 0.15
};

iG.height = function() {
	return f_clientHeight() - iG.config.borderWidth * 2;
};

iG.width = function() {
	return f_clientWidth() - iG.config.borderWidth * 2;
};

iG.RenderControl = (function() {
	var RenderControl_ = function() {
		this.events = {
				'updated' : true
		};
	};
	
	Ext.extend(RenderControl_, Ext.util.Observable, {});
	
	return new RenderControl_;
})();

iG.getTextWidth = function(string) {
	var string_ = new Ext.Element(document.createElement('div'));
	var length = string_.getTextWidth(string);
	Ext.destroy(string_);
	
	return length;
};

iG.tooltip = function(config) {
	var tip=null,
		layer=null,
		timeout=null,
		width=170,
		height=70;

	function hide() {
		if (timeout !== null) {
			clearTimeout(timeout);
		}
		
		if (layer) {
			layer.hide();
		}
	}

	function destroy() {
		if (timeout !== null) {
			clearTimeout(timeout);
		}
		
		if (layer) {
			layer = layer.destroy();
			Ext.destroy(tip);
			
			tip = layer = null;
		}
	}

	return {
		show : function(d, scope) {
			var t = pv.Transform.identity, p = scope.parent;
			do {
				t = t.translate(p.left(), p.top()).times(p.transform());
			} while (p = p.parent);

			if (!tip) {
				var c = Ext.get(scope.root.canvas());
				c.setStyle('position', 'relative');
				
				c.addListener('mouseleave', destroy)

				tip = c.appendChild(document.createElement('div'));
				tip.setStyle('position', 'absolute');
				
				layer = new Ext.Layer({
					constrain : true,
					shadow : 'frame',
					shadowOffset : 8
				}, tip);
			}
			
			tip.setSize(width, height);
			tip.setLeftTop(Math.floor(scope.left() * t.k + t.x) - width, Math.floor(scope.top() * t.k + t.y) - height);
			
			layer.update('<div class="{0}"><h3>{1}</h3><div><p><i>{2}</i></p><p><center><b>{3}</b></center></p></div></div>'.format(
				'iG-tooltip',
			    config.label,
			    (new Date(d.x*1000)).toLocaleString(),
			    parseFloat(d.y).toFixed(2)
			));
			layer.alignTo(tip);
			
			timeout = setTimeout(function() {
				layer.show();
			}, 400);
		},
		
		hide : function() {
			hide();
		},
		
		destroy : function() {
		    destroy();	
		}
	};
};

iG.cursorStyle = function() {
	return document.body.style.cursor;
};

iG.cursor = function() {
	var defaultStyle = document.body.style.cursor;
	
	return {
		wait : function() {
			document.body.style.cursor = 'wait';
		},
		restore : function() {
			document.body.style.cursor = defaultStyle;
		}
	};
};