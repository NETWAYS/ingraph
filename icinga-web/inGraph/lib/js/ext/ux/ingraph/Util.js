
/**
 * Ext.ux.ingraph.Util
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.ingraph.
 *
 * Ext.ux.ingraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.ingraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.ingraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph');

    /**
     * @class Ext.ux.ingraph.Util
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @singleton
     */
    Ext.ux.ingraph.Util = (function () {
        var byteSpec = {
            base: 1024,
            units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
        };
        var timeSpec = {
            base: 1000,
            units: ['s', 'ms', 'ns', 'ps']
        };
        var calcPow = function (v, base, max, abs) {
            var pow = Math.floor(Math.log(v) / Math.log(base));
            if (abs !== undefined && abs === true) {
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
            formatByte: function (v) {
                var pow = calcPow(v, byteSpec.base);
                return {
                    value: v / Math.pow(byteSpec.base, pow),
                    unit: byteSpec.units[pow]
                };
            },

            formatTime: function (v) {
                var sign = v >= 0 ? 1 : -1;
                v = Math.abs(v);
                if (v < 1) {
                    var pow = calcPow(v, timeSpec.base, timeSpec.units.length,
                                      true);
                    return {
                        value: v * Math.pow(timeSpec.base, pow) * sign,
                        unit: timeSpec.units[pow]
                    };

                }
                return {
                    value: v * sign,
                    unit: 's'
                };
            },

            formatPercent: function (v) {
                return {
                    value: v,
                    unit: '%'
                };
            },

            formatCounter: function (v) {
                return {
                    value: v,
                    unit: 'c'
                };
            },

            lcs: function () {
                var s = [],
                    strings = [],
                    c;
                for (var t = 0; t < arguments.length; ++t) {
                    strings.push(arguments[t]);
                }
                strings.sort(function (a, b) {
                    return a.label === b.label ? 0 : (a.label < b.label ? -1 : 1);
                });
                for (var i = 0; i < strings[0].length; ++i) {
                    c = strings[0][i];
                    var e = (function () {
                        for (var j = 1; j < strings.length; ++j) {
                            if (c !== strings[j][i]) {
                                return false;
                            }
                        }
                    })();
                    if (e === false) {
                        break;
                    }
                    s.push(c);
                }
                return s.join('').replace(/[^A-Za-z0-9]+$/, '');
            },

            buildQuery: function (series) {
                var query = {};
                Ext.each(series, function (item) {
                    var qpart = query;
                    Ext.each([item.host, item.service],
                        function (v) {
                         if (!Ext.isObject(qpart[v])) {
                             qpart[v] = {};
                         }
                         qpart = qpart[v];
                    }, this);
                    if (!Ext.isArray(qpart[item.plot])) {
                        qpart[item.plot] = [];
                    }
                    qpart = qpart[item.plot];
                    if (!Ext.isArray(item.type)) {
                        item.type = [item.type];
                    }
                    Ext.each(item.type, function (type) {
                        if (qpart.indexOf(type) === -1) {
                            qpart.push(type);
                        }
                    });
                }, this);
                return query;
            },

            xTickFormatter: function (v, axis, dtrack) {
                if (axis.ticks.length === 0) {
                    this.lastDate = null;
                }
                var d = new Date(v);
                d = new Date(v - d.getTimezoneOffset() * 60 * 1000);
                var fmt = '%b %d %y %h:%M';
                if (Ext.isDate(this.lastDate)) {
                    if (this.lastDate.getFullYear() === d.getFullYear() &&
                        this.lastDate.getMonth() === d.getMonth() &&
                        this.lastDate.getDate() === d.getDate())
                    {
                        fmt = '%h:%M';
                    }
                }
                if (dtrack === undefined && v > axis.min) {
                    this.lastDate = d;
                }
                return $.plot.formatDate(d, fmt, this.monthNames);
            },

            yTickFormatter: function (v, axis) {
                if (this.showLabel !== false
                    && axis.ticks.length === 0
                ) {
                    this.rawTicks = axis.tickGenerator(axis);
                }
                if (this.units === undefined) {
                    this.units = {
                        'byte': Ext.ux.ingraph.Util.formatByte,
                        time: Ext.ux.ingraph.Util.formatTime,
                        percent: Ext.ux.ingraph.Util.formatPercent,
                        c: Ext.ux.ingraph.Util.formatCounter
                    };
                }
                if (this.showLabel !== false
                    && this.label
                    && v === this.rawTicks.last()
                ) {
                    if (!Ext.isArray(this.label)) {
                        this.label = [this.label];
                    }
                    var s = Ext.ux.ingraph.Util.lcs.apply(Ext.ux.ingraph.Util, this.label);
                    if (s.length === 0) {
                        s = this.label[0];
                    }
                    return '<div ext:qtip="' + this.label.join('<br />') + '">' +
                        Ext.util.Format.ellipsis(s, 15) + '</div>';
                }
                if (v > 0 && this.units[this.unit] !== undefined) {
                    var callback = this.units[this.unit],
                        format = callback.call(this, v);
                    return format.value.toFixed(axis.tickDecimals) + ' ' + format.unit;
                }
                return v.toFixed(axis.tickDecimals);
            }
        };
    }());
}());
