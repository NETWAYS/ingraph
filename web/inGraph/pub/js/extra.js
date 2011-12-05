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

(function() {
var _constructor = Ext.data.Store.prototype.constructor;
Ext.override(Ext.data.Store, {
    constructor : function(cfg) {
        _constructor.call(this, cfg);
        this.on({
            exception: function(proxy, type, action, options, response, arg) {
                var resp = Ext.decode(response.responseText);
                Ext.ux.Toast.msg(
                    _('Error'),
                    resp.errorMessage
                );
            },
            scope: this
        })
    }
}); 
})();

Ext.Ajax.on('requestexception', function(c, r) {
    var resp = Ext.decode(r.responseText);
    Ext.ux.Toast.msg(
        _('Error'),
        resp.errorMessage
    );
});
