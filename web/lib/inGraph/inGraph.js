if(typeof _  != 'function') {  _ = function(str) { return str; }; }

/**
 * Creates a new array with the results of calling a provided function on every
 * element in this array. Implemented in Javascript 1.6.
 *
 * @function
 * @name Array.prototype.map
 * @see <a
 * href="https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/Map">map</a>
 * documentation.
 * @param {function} f function that produces an element of the new Array from
 * an element of the current one.
 * @param [o] object to use as <tt>this</tt> when executing <tt>f</tt>.
 */
if(!Array.prototype.map) Array.prototype.map = function(f, o) {
  var n = this.length;
  var result = new Array(n);
  for (var i = 0; i < n; i++) {
    if (i in this) {
      result[i] = f.call(o, this[i], i, this);
    }
  }
  return result;
};

/**
 * Creates a new array with all elements that pass the test implemented by the
 * provided function. Implemented in Javascript 1.6.
 *
 * @function
 * @name Array.prototype.filter
 * @see <a
 * href="https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/filter">filter</a>
 * documentation.
 * @param {function} f function to test each element of the array.
 * @param [o] object to use as <tt>this</tt> when executing <tt>f</tt>.
 */
if(!Array.prototype.filter) Array.prototype.filter = function(f, o) {
  var n = this.length;
  var result = new Array();
  for (var i = 0; i < n; i++) {
    if (i in this) {
      var v = this[i];
      if (f.call(o, v, i, this)) result.push(v);
    }
  }
  return result;
};

/**
 * Returns the last element in the array or null if empty.
 */
if(!Array.prototype.last) Array.prototype.last = function() {
	var n = this.length;
	
	return n ? this[n-1] : null; 
};

if(!String.prototype.format) String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; ++i) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


var iG = {};

iG.version = {
    major: 0,
    minor: 1
};

iG.timeFrames = (function() {
	var frames = new Ext.util.MixedCollection();
	frames.addAll([{
	        title   : 'Hourly',
	        start   : '-1 hour',
	        show	: false,
	    }, {
	        title   : 'Daily',
	        start   : '-1 day',
	        overview: true
	    }, {
	        title   : 'Weekly',
	        start   : '-1 week'
	    }, {
	        title   : 'Monthly',
	        start   : '-1 month'
	    }, {
	        title   : 'Yearly',
	        start   : '-1 year'
	}].map(function(frame, index) {
		return Ext.applyIf(frame, {
			show	: true,
			end		: '',
			overview: false,
			id		: frame.title.toUpperCase(),
			index	: index
		});
	}));
	
	return {
		getAll		: function() {
			return frames;
		},
		
		getDefault	: function() {
			return frames.filter('show', true);
		}
	}
})();