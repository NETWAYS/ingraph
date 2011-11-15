Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Util
 * @singleton
 */
Ext.iG.Util = function() {
    var byteSpec = {
        base: 1024,
        units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
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
            }
        },
        
        formatCounter: function(v) {
            return {
                value: v,
                unit: 'c'
            }
        }
    }
}();