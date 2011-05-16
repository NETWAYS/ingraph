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

if(!Array.prototype.last) Array.prototype.last = function() {
	var n = this.length;
	
	return n ? this[n-1] : null; 
};

if(!Array.prototype.sum) Array.prototype.sum = function() {
	for(var i=0, sum=0; i < this.length; sum += this[i++]);
	return sum;
};

if(!Array.prototype.mean) Array.prototype.mean = function() {
	return this.sum()/this.length;
};

if(!Array.prototype.variance) Array.prototype.variance = function(bias) {
	bias = bias || false;
	return (this.map(function(v) {
        return Math.pow(v, 2);
    }).sum() - (Math.pow(this.sum(), 2) / this.length)) / bias ? this.length : this.length -1;
};

if(!Array.prototype.std) Array.prototype.std = function() {
	return Math.sqrt(this.variance());
};

if(!String.prototype.format) String.prototype.format = function() {
	var str = this,
		t = 0;
	
    for(var i = 0; i < arguments.length; ++i) {
    	var arg = arguments[i];
    	
    	if(typeof arg == 'object') {
    		for(var key in arg) {
    			var re = new RegExp('\\{' + key + '\\}', 'gi');
    			str = str.replace(re, arg[key]);
    		}
    	} else {
			var re = new RegExp('\\{' + t + '\\}', 'gi'); 
			str = str.replace(re, arg);
			++t;
    	}
    }
    
    return str;
};

if(!String.prototype.ucfirst) String.prototype.ucfirst = function() {
	return this.substr(0, 1).toUpperCase() + this.substr(1, this.length);
};

var iG = {};

iG.version = {
    major: 0,
    minor: 1
};

iG.functor = function(v) {
  return typeof v === 'function' ? v : function() { return v; };
};

iG.timeFrames = (function() {
	var frames = new Ext.util.MixedCollection(false, function(o) {
		return o.title.toUpperCase();
	});
	
	frames.on({
		add : function(i, o) {
			Ext.applyIf(o, {
					show	: true,
					end		: iG.functor(''),
					overview: false,
					id		: o.title.toUpperCase(),
					index	: i
			});
		}
	});

	frames.addAll([{
        title   : 'Hourly',
        start   : (function() {
        	var d = new Date();
        	return (Math.ceil(d/1000) - (4200));
        }),
        show	: false,
    }, {
        title   : 'Daily',
        start   : (function() {
        	var d = new Date();
        	return (Math.ceil(d/1000) - (90000));
        }),
        overview: true
    }, {
        title   : 'Weekly',
        start   : (function() {
        	var d = new Date();
        	return (Math.ceil(d/1000) - (691200));
        })
    }, {
        title   : 'Monthly',
        start   : (function() {
        	var d = new Date();
        	return (Math.ceil(d/1000) - (2937600));
        })
    }, {
        title   : 'Yearly',
        start   : (function() {
        	var d = new Date();
        	return (Math.ceil(d/1000) - (31968000));
        })
	}]);
	
	return {
		getAll		: function() {
			return frames;
		},
		
		getDefault	: function() {
			return frames.filter('show', true);
		}
	}
})();

iG.merge = function(target, obj) {
	return jQuery.extend(true, target, obj);
}