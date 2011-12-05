Ext.ns('AppKit.util.Config');

AppKit.util.Config = function() {
    return {
        getBaseUrl: function() {
            return (document.location.protocol.indexOf('https') === 0 ? 'https://' : 'http://') +
                   (document.location.host || document.domain) +
                   document.location.pathname.replace(/\/$/, '');
        }
    };
}();
