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
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

; (function () {
    'use strict';

    var VERSION = 1.2,
        root = this,
        $ = root.jQuery;

    function inGraph () {
        if (!(this instanceof inGraph)) {
            /*jshint newcap: false */
            return new inGraph();
        }
    }

    root.inGraph = inGraph;

    inGraph.format = (function () {
        var byteSpec = {
                base: 1024,
                units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
            },
            timeSpec = {
                base: 1000,
                units: ['s', 'ms', 'ns', 'ps']
            },
            calcPow = function (v, base, max, abs) {
                var pow = Math.floor(Math.log(v) / Math.log(base));
                if (abs === true) {
                    pow = Math.abs(pow);
                }
                if (pow < 0) {
                    pow = 0;
                }
                if (pow > max) {
                    pow = max;
                }
                return pow;
            };
        return {
            byte: function (v) {
                var pow = calcPow(v, byteSpec.base, byteSpec.units.length);
                return {
                    value: v / Math.pow(byteSpec.base, pow),
                    unit: byteSpec.units[pow]
                };
            },
            time: function (v) {
                var sign = v >= 0 ? 1 : -1;
                v = Math.abs(v);
                if (v < 1) {
                    // Use a smaller unit
                    var pow = calcPow(v, timeSpec.base, timeSpec.units.length,
                                      true);
                    return {
                        value: v * Math.pow(timeSpec.base, pow) * sign,
                        unit: timeSpec.units[pow]
                    };
                }
                if (v > 48 * 60 * 60) {
                    // Switch to days after 48 hours
                    return {
                        value: v / 60 / 60 / 24 * sign,
                        unit: 'd'
                    };
                }
                if (v > 120 * 60) {
                    // Switch to hours after 120 minutes
                    return {
                        value: v / 60 / 60 * sign,
                        unit: 'h'
                    };
                }
                if (v > 60 * 10) {
                    // Switch to minutes
                    return {
                        value: v / 60 * sign,
                        unit: 'm'
                    };
                }
                return {
                    value: v * sign,
                    unit: 's'
                };
            },
            counter: function (v) {
                return {
                    value: v,
                    unit: 'c'
                };
            },
            percent: function (v) {
                return {
                    value: v,
                    unit: '%'
                };
            },
            query: function (series) {
                var query = [];
                $.each(series, function (i, item) {
                    var qpart = {
                        host: item.host,
                        service: item.service,
                        plot: item.plot,
                        parent_service: item.parentService
                    };
                    if (!$.isArray(item.type)) {
                        item.type = [item.type];
                    } else {
                        item.type = $.unique(item.type);
                    }
                    $.each(item.type, function (i, type) {
                        qpart.type = type;
                        query.push(qpart);
                    });
                });
                return query;
            }
        };
    }());

    inGraph.flot = (function () {
        return {
            xTickFormatter: function (v, axis, dtrack) {
                if (axis.ticks.length === 0) {
                    this.lastDate = null;
                }
                var d = new Date(v);
                var fmt = '%b %d %y %H:%M';
                if (this.lastDate) {
                    if (this.lastDate.getFullYear() === d.getFullYear() &&
                        this.lastDate.getMonth() === d.getMonth() &&
                        this.lastDate.getDate() === d.getDate()
                    ) {
                        fmt = '%H:%M';
                    }
                }
                if (dtrack === undefined && v > axis.min) {
                    this.lastDate = d;
                }
                return $.plot.formatDate(d, fmt, this.monthNames);
            },
            yTickFormatter: function (v, axis) {
                // TODO(el): Move this into a plugin like jquery.flot.time
                if (!this.format) {
                    this.format = {
                        byte: $.proxy(inGraph.format.byte, this),
                        time: $.proxy(inGraph.format.time, this),
                        percent: $.proxy(inGraph.format.percent, this),
                        c: $.proxy(inGraph.format.counter, this)
                    };
                }
                if (v > 0 &&
                    this.format[this.unit]
                ) {
                    var arg = this.format[this.unit](v);
                    return arg.value.toFixed(axis.tickDecimals) + ' ' + arg.unit;
                }
                return v.toFixed(axis.tickDecimals);
            }
        };
    }());

}.call(this));
