(function () {
    'use strict';
    /**
     * Find the position of a specified value within a sorted array.
     * @param {Mixed} value the value to find
     * @return {Number}
     */
    if (!Array.prototype.bsearch) {
        Array.prototype.bsearch = function (value) {
            var high = this.length,
                low = -1,
                mid;
            while (high - low > 1) {
                if (this[mid = high + low >> 1] < value) {
                    low = mid;
                } else {
                    high = mid;
                }
            }
            return this[high] !== value ? -1 : high;
        };
    }
    /**
     * Return the last element of an array or null if empty.
     * @function last
     * @name Array.prototype.last
     * @return {Mixed}
     */
    if (!Array.prototype.last) {
        Array.prototype.last = function () {
            var n = this.length;
            return n ? this[n - 1] : null;
        };
    }
    /**
     * Calculates the sum of the Array
     * @return {Number}
     */
    if (!Array.prototype.sum) {
        Array.prototype.sum = function () {
            for (var i = 0, sum = 0,
                     n = this.length; i < n; sum += this[i++]) {}
            return sum;
        };
    }
    /**
     * Calculates the mean of the Array
     * @return {Number}
     */
    if (!Array.prototype.mean) {
        Array.prototype.mean = function() {
            return this.sum() / this.length;
        };
    }
}());
