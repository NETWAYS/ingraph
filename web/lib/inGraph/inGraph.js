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
}