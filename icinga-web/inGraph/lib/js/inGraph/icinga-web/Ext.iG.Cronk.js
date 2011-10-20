Ext.ns('Ext.iG.Cronk');
/**
 * @class Ext.iG.Cronk
 * @singleton
 */
Ext.iG.Cronk = function() {
	return {
		open: function(cfg) {
			var cronk = {
                    id: Ext.id(),
                    title: cfg.title,
                    crname: 'inGraph',
                    iconCls: 'icinga-cronk-icon-stats2',
                    closable: true,
                    params: {
                        host: cfg.host,
                        service: cfg.service
                    }   
                },
                tabs = Ext.getCmp('cronk-tabs'),
                panel = Cronk.factory(cronk);
            tabs.add(panel);
            tabs.setActiveTab(panel);
		},
		preview: function(cfg) {
			var preview = new Ext.Window({
                title: cfg.title,
                layout: 'fit',
                height: cfg.height,
                width: cfg.width,
                items: new Ext.iG.Flot({
                    loadMask: false,
                    host: cfg.host,
                    service: cfg.service,
                    store: new Ext.iG.FlotJsonStore({
                        url: AppKit.util.Config.getBaseUrl() + '/' +
                             'modules/ingraph/provider/plots',
                        baseParams: {
                            host: cfg.host,
                            service: cfg.service
                        }
                    })
                })
            });
            preview.show();
		}
	}
}();