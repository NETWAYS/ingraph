Ext.ns('Ext.iG.Urls');
/**
 * @class Ext.iG.Urls
 * @extends Object
 * @singleton
 */
Ext.iG.Urls = function() {
    var base = AppKit.util.Config.getBaseUrl() + '/modules/ingraph/',
        baseProvider = base + 'provider/',
        baseComments = base + 'comments/',
        baseTemplates = base + 'templates/',
        baseViews = base + 'views/';
    return {
        provider: {
            hosts: baseProvider + 'hosts',
            services: baseProvider + 'services',
            plots: baseProvider + 'plots',
            template: baseProvider + 'template',
            values: baseProvider + 'values',
            view: baseProvider + 'view',
            views: baseProvider + 'views'
        },
        comments: {
            add: baseComments + 'add',
            edit: baseComments + 'edit',
            delete: baseComments + 'delete'
        },
        templates: {
            edit: baseTemplates + 'edit'
        },
        views: {
            edit: baseViews + 'edit'
        },
        available: false,
        overwrite: function(urls) {
            urls.available = true;
            return (Ext.iG.Urls = urls);
        }
    }
}();