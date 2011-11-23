Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Provider
 * @extends Object
 * @singleton
 */
Ext.iG.Provider = function() {
    var urlBase = AppKit.util.Config.getBaseUrl() + '/' +
        'modules/ingraph/provider/';
    return {
        urls: {
            hosts: urlBase + 'hosts',
            services: urlBase + 'services',
            views: urlBase + 'views',
            template: urlBase + 'template',
            values: urlBase + 'values'
        }
    }
}();