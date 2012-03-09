(function () {
    "use strict";

    Ext.ns('AppKit');

    AppKit = (function () {
        return {
            log: function () {
                if (Ext.isObject(console) && Ext.isFunction(console.log)) {
                    console.log.apply(console, arguments);
                }
            }
        };
    }());

    Ext.ns('AppKit.util.Config');

    AppKit.util.Config = (function () {
        return {
            getBaseUrl: function () {
                var baseUrl = (document.location.protocol.indexOf('https') === 0 ? 'https://' : 'http://') +
                    (document.location.host || document.domain) +
                    document.location.pathname.replace(/\/$/, '');
                return baseUrl;
            }
        };
    }());
}());
