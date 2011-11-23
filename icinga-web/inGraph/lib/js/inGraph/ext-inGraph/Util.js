Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Util
 * @singleton
 */
Ext.iG.Util = function() {
    var byteSpec = {
        base: 1024,
        units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    };
    var timeSpec = {
        base: 1000,
        units: ['s', 'ms', 'ns', 'ps']
    };
    var calcPow = function(v, base, max, abs) {
        var pow = Math.floor(Math.log(v)/Math.log(base));
        if(abs !== undefined && abs === true) {
            pow = Math.abs(pow);
        }
        if(pow < 0) {
            pow = 0;
        }
        if(pow > max) {
            pow = max;
        }
        return pow;
    };
    return {
        formatByte: function(v) {
            var pow = calcPow(v, byteSpec.base);
            return {
                value: v/Math.pow(byteSpec.base, pow),
                unit: byteSpec.units[pow]
            };
        },
        
        formatTime: function(v) {
            var sign = v >= 0 ? 1 : -1;
            v = Math.abs(v);
            if(v < 1) {
                var pow = calcPow(v, timeSpec.base, timeSpec.units.length,
                                  true);
                return {
                    value: v*Math.pow(timeSpec.base, pow)*sign,
                    unit: timeSpec.units[pow]
                };
                
            }
            return {
                value: v*sign,
                unit: 's'
            };
        },
        
        formatPercent: function(v) {
            return {
                value: v,
                unit: '%'
            };
        },
        
        formatCounter: function(v) {
            return {
                value: v,
                unit: 'c'
            };
        },
        
        lcs: function() {
            var s = [],
                strings = [],
                c;
            for(var t = 0; t < arguments.length; ++t) {
                strings.push(arguments[t]);
            }
            strings.sort(function(a, b) {
                return a.label === b.label ? 0 : (a.label < b.label ? -1 : 1);
            });
            for(var i = 0; i < strings[0].length; ++i) {
                c = strings[0][i];
                e = (function() {
                    for(var j = 1; j < strings.length; ++j) {
                        if(c !== strings[j][i]) {
                            return false;
                        }
                    }
                })();
                if(e === false) {
                    break;
                }
                s.push(c);
            }
            return s.join('').replace(/[^A-Za-z0-9]+$/, '');
        },
        
        buildQuery: function(series) {
            var query = {};
            Ext.each(series, function(item) {
                var qpart = query;
                Ext.each([item.host, item.service],
                    function(v) {
                     if(!Ext.isObject(qpart[v])) {
                         qpart[v] = {};
                     }
                     qpart = qpart[v];
                }, this);
                if(!Ext.isArray(qpart[item.plot])) {
                    qpart[item.plot] = [];
                }
                qpart = qpart[item.plot];
                if(!Ext.isArray(item.type)) {
                    item.type = [item.type];
                }
                Ext.each(item.type, function(type) {
                    if(qpart.indexOf(type) === -1) {
                        qpart.push(type);
                    }
                });
            }, this);
            return query;
        },
        
        xTickFormatter: function(v, axis, dtrack) {
            if(axis.ticks.length === 0) {
                this.lastDate = null;
            }
            var d = new Date(v);
            d = new Date(v - d.getTimezoneOffset()*60*1000);
            var fmt = '%b %d %y %h:%M';
            if(Ext.isDate(this.lastDate)) {
                if(this.lastDate.getFullYear() === d.getFullYear() &&
                   this.lastDate.getMonth() === d.getMonth() &&
                   this.lastDate.getDate() === d.getDate()) {
                    fmt = '%h:%M';
                }
            }
            if(dtrack === undefined && v > axis.min) {
                this.lastDate = d;
            }
            return $.plot.formatDate(d, fmt, this.monthNames);
        },
        
        yTickFormatter: function(v, axis) {
            if(axis.ticks.length === 0) {
                this.rawTicks = axis.tickGenerator(axis);
            }
            if(this.units === undefined) {
                this.units = {
                    byte: Ext.iG.Util.formatByte,
                    time: Ext.iG.Util.formatTime,
                    percent: Ext.iG.Util.formatPercent,
                    c: Ext.iG.Util.formatCounter
                };
            }
            if(v === this.rawTicks.last() && Ext.isArray(this.label)) {
                var s = Ext.iG.Util.lcs.apply(Ext.iG.Util, this.label);
                if(s.length === 0) {
                    s = this.label[0];
                }
                return '<div ext:qtip="' + this.label.join('<br />') + '">' +
                       Ext.util.Format.ellipsis(s, 15) + '</div>';
            }
            if(v > 0 && this.units[this.unit] !== undefined) {
                var callback = this.units[this.unit],
                    format = callback.call(this, v);
                return format.value.toFixed(axis.tickDecimals) + ' ' + format.unit;
            }
            return v.toFixed(axis.tickDecimals);
        }
    };
}();
