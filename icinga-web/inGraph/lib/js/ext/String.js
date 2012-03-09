/*
 * Allow named arguments
 */
(function () {
    "use strict";

    var _format = String.format;

    String.format = function (format) {
        var newargs = [];

        Ext.each(Ext.toArray(arguments, 1), function (arg) {
            if (Ext.isObject(arg)) {
                Ext.iterate(arg, function (key, value) {
                    format = format.replace(
                        new RegExp('\\{(' + key + ')\\}', 'gi'),
                        value
                    );
                });
            } else {
                newargs.push(arg);
            }
        });

        newargs.unshift(format);

        return _format.apply(this, newargs);
    };
}());
