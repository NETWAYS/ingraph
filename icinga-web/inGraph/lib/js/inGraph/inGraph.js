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

iG.merge = function() {
	return jQuery.extend.apply(jQuery, arguments);
};

iG.getXIndex = function(x, series) {
	var i = series.map(function(xy) {
		return xy[0];
	}).bsearch(x);
	
	return i == -1 ? false : i;
};

iG.getY = function(x, series, fn) {
	var i = iG.getXIndex(x, series);
	return i ? (typeof fn == 'function' ? fn(series[i][1]) : series[i][1]) : undefined;
};