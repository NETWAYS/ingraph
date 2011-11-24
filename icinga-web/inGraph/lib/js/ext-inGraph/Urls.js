Ext.ns('Ext.iG.Urls');
/**
 * @class Ext.iG.Urls
 * @extends Object
 * @singleton
 */
Ext.iG.Urls = function() {
    return {
        available: false,
        overwrite: function(urls) {
            urls.available = true;
            return (Ext.iG.Urls = urls);
        }
    }
}();