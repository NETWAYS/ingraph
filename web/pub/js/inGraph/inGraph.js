if(typeof _  != 'function') {  _ = function(str) { return str; }; }

if(typeof strtotime != 'function') {
	function strtotime (str, now) {
	    // http://kevin.vanzonneveld.net
	    // +   original by: Caio Ariede (http://caioariede.com)
	    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    // +      input by: David
	    // +   improved by: Caio Ariede (http://caioariede.com)
	    // +   improved by: Brett Zamir (http://brett-zamir.me)
	    // +   bugfixed by: Wagner B. Soares
	    // +   bugfixed by: Artur Tchernychev
	    // %        note 1: Examples all have a fixed timestamp to prevent tests to fail because of variable time(zones)
	    // *     example 1: strtotime('+1 day', 1129633200);
	    // *     returns 1: 1129719600
	    // *     example 2: strtotime('+1 week 2 days 4 hours 2 seconds', 1129633200);
	    // *     returns 2: 1130425202
	    // *     example 3: strtotime('last month', 1129633200);
	    // *     returns 3: 1127041200
	    // *     example 4: strtotime('2009-05-04 08:30:00');
	    // *     returns 4: 1241418600
	    var i, match, s, strTmp = '',
	        parse = '';

	    strTmp = str;
	    strTmp = strTmp.replace(/\s{2,}|^\s|\s$/g, ' '); // unecessary spaces
	    strTmp = strTmp.replace(/[\t\r\n]/g, ''); // unecessary chars
	    if (strTmp == 'now') {
	        return (new Date()).getTime() / 1000; // Return seconds, not milli-seconds
	    } else if (!isNaN(parse = Date.parse(strTmp))) {
	        return (parse / 1000);
	    } else if (now) {
	        now = new Date(now * 1000); // Accept PHP-style seconds
	    } else {
	        now = new Date();
	    }

	    strTmp = strTmp.toLowerCase();

	    var __is = {
	        day: {
	            'sun': 0,
	            'mon': 1,
	            'tue': 2,
	            'wed': 3,
	            'thu': 4,
	            'fri': 5,
	            'sat': 6
	        },
	        mon: {
	            'jan': 0,
	            'feb': 1,
	            'mar': 2,
	            'apr': 3,
	            'may': 4,
	            'jun': 5,
	            'jul': 6,
	            'aug': 7,
	            'sep': 8,
	            'oct': 9,
	            'nov': 10,
	            'dec': 11
	        }
	    };

	    var process = function (m) {
	        var ago = (m[2] && m[2] == 'ago');
	        var num = (num = m[0] == 'last' ? -1 : 1) * (ago ? -1 : 1);

	        switch (m[0]) {
	        case 'last':
	        case 'next':
	            switch (m[1].substring(0, 3)) {
	            case 'yea':
	                now.setFullYear(now.getFullYear() + num);
	                break;
	            case 'mon':
	                now.setMonth(now.getMonth() + num);
	                break;
	            case 'wee':
	                now.setDate(now.getDate() + (num * 7));
	                break;
	            case 'day':
	                now.setDate(now.getDate() + num);
	                break;
	            case 'hou':
	                now.setHours(now.getHours() + num);
	                break;
	            case 'min':
	                now.setMinutes(now.getMinutes() + num);
	                break;
	            case 'sec':
	                now.setSeconds(now.getSeconds() + num);
	                break;
	            default:
	                var day;
	                if (typeof(day = __is.day[m[1].substring(0, 3)]) != 'undefined') {
	                    var diff = day - now.getDay();
	                    if (diff == 0) {
	                        diff = 7 * num;
	                    } else if (diff > 0) {
	                        if (m[0] == 'last') {
	                            diff -= 7;
	                        }
	                    } else {
	                        if (m[0] == 'next') {
	                            diff += 7;
	                        }
	                    }
	                    now.setDate(now.getDate() + diff);
	                }
	            }
	            break;

	        default:
	            if (/\d+/.test(m[0])) {
	                num *= parseInt(m[0], 10);

	                switch (m[1].substring(0, 3)) {
	                case 'yea':
	                    now.setFullYear(now.getFullYear() + num);
	                    break;
	                case 'mon':
	                    now.setMonth(now.getMonth() + num);
	                    break;
	                case 'wee':
	                    now.setDate(now.getDate() + (num * 7));
	                    break;
	                case 'day':
	                    now.setDate(now.getDate() + num);
	                    break;
	                case 'hou':
	                    now.setHours(now.getHours() + num);
	                    break;
	                case 'min':
	                    now.setMinutes(now.getMinutes() + num);
	                    break;
	                case 'sec':
	                    now.setSeconds(now.getSeconds() + num);
	                    break;
	                }
	            } else {
	                return false;
	            }
	            break;
	        }
	        return true;
	    };

	    match = strTmp.match(/^(\d{2,4}-\d{2}-\d{2})(?:\s(\d{1,2}:\d{2}(:\d{2})?)?(?:\.(\d+))?)?$/);
	    if (match != null) {
	        if (!match[2]) {
	            match[2] = '00:00:00';
	        } else if (!match[3]) {
	            match[2] += ':00';
	        }

	        s = match[1].split(/-/g);

	        for (i in __is.mon) {
	            if (__is.mon[i] == s[1] - 1) {
	                s[1] = i;
	            }
	        }
	        s[0] = parseInt(s[0], 10);

	        s[0] = (s[0] >= 0 && s[0] <= 69) ? '20' + (s[0] < 10 ? '0' + s[0] : s[0] + '') : (s[0] >= 70 && s[0] <= 99) ? '19' + s[0] : s[0] + '';
	        return parseInt(this.strtotime(s[2] + ' ' + s[1] + ' ' + s[0] + ' ' + match[2]) + (match[4] ? match[4] / 1000 : ''), 10);
	    }

	    var regex = '([+-]?\\d+\\s' + '(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?' + '|sun\\.?|sunday|mon\\.?|monday|tue\\.?|tuesday|wed\\.?|wednesday' + '|thu\\.?|thursday|fri\\.?|friday|sat\\.?|saturday)' + '|(last|next)\\s' + '(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?' + '|sun\\.?|sunday|mon\\.?|monday|tue\\.?|tuesday|wed\\.?|wednesday' + '|thu\\.?|thursday|fri\\.?|friday|sat\\.?|saturday))' + '(\\sago)?';

	    match = strTmp.match(new RegExp(regex, 'gi')); // Brett: seems should be case insensitive per docs, so added 'i'
	    if (match == null) {
	        return false;
	    }

	    for (i = 0; i < match.length; i++) {
	        if (!process(match[i].split(' '))) {
	            return false;
	        }
	    }

	    return (now.getTime() / 1000);
	}
}

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

if (!Array.prototype.bsearch) Array.prototype.bsearch = function(value) {
	var high = this.length,
		low = -1,
		mid;
		
	while(high - low > 1) {
		if(this[mid = high + low >> 1] < value) {
			low = mid;
		} else {
			high = mid;
		}
	}
	
	return this[high] != value ? -1 : high;
}

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
					end		: function() { return Math.ceil((new Date()).getTime()/1000); },
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

iG.merge = function() {
	return jQuery.extend.apply(jQuery, arguments);
}

iG.getXIndex = function(x, series) {
	var i = series.map(function(xy) {
		return xy[0];
	}).bsearch(x);
	
	return i == -1 ? false : i;
}

iG.getY = function(x, series, fn) {
	var i = iG.getXIndex(x, series);
	return i ? (typeof fn == 'function' ? fn(series[i][1]) : series[i][1]) : undefined;
}