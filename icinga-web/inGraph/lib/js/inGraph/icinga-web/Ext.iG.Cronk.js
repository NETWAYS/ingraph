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
		Window: function(cfg) {
			var win = new Ext.Window({
                title: cfg.title,
                height: cfg.height,
                width: cfg.width,
                layout: 'fit',
                items: new Ext.iG.FlotPanel({
                    header: false,
                    host: cfg.host,
                    service: cfg.service,
                    overview: cfg.overview,
                    store: new Ext.iG.FlotJsonStore({
                        url: AppKit.util.Config.getBaseUrl() + '/' +
                             'modules/ingraph/provider/plots',
                        baseParams: {
                            host: cfg.host,
                            service: cfg.service,
                            start: cfg.start
                        }
                    })
                })
            });
            win.show();
		},
		Popup: function(cfg) {
			var tip = new Ext.ToolTip({
				title: cfg.title,
				target: cfg.target,
				renderTo: Ext.getBody(),
				anchor: 'left',
                items: new Ext.iG.Flot({
	                width: cfg.width,
	                height: cfg.height,
                    loadMask: true,
                    host: cfg.host,
                    service: cfg.service,
                    flotOptions: {
                    	legend: {
                    		show: false
                    	},
                    	yaxis: {
                    		show: false
                    	},
                    	grid: {
                    		hoverable: false,
                    		clickable: false
                    	}
                    },
                    store: new Ext.iG.FlotJsonStore({
                        url: AppKit.util.Config.getBaseUrl() + '/' +
                             'modules/ingraph/provider/plots',
                        baseParams: {
                            host: cfg.host,
                            service: cfg.service,
                            start: cfg.start
                        }
                    })
                }),
                listeners: {
                	hide: function(self) {
                		self.destroy();
                	}
                }
			});
			tip.show();
		}
	}
}();