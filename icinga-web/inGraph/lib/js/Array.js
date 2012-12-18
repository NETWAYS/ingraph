/*
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

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
