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

Ext.ns('Ext.iG.Cronk.ColumnRenderer');
/**
 * @class Ext.iG.Cronk.ColumnRenderer
 * @singleton
 */
Ext.iG.Cronk.ColumnRenderer = function() {
    var g,
        s,
        c,
        task;
    var Preview = function(e, el) {
        var row = g.getView().findRowIndex(el);
        if(row !== false) {
            var rec = s.getAt(row);
            Ext.iG.Cronk.Window({
                title: new Ext.XTemplate(c.title).apply(rec.data),
                host: rec.get(c.host),
                service: rec.get(c.service),
                start: c.preview.start ?
                       Math.ceil(strtotime(c.preview.start)) : '',
                height: c.preview.height,
                width: c.preview.width,
                overview: c.preview.overview
            });
        }
    };
    var Popup = function(e, el) {
        var row = g.getView().findRowIndex(el);
        if(row !== false) {
            var rec = s.getAt(row);
            Ext.iG.Cronk.Popup({
                title: new Ext.XTemplate(c.title).apply(rec.data),
                host: rec.get(c.host),
                service: rec.get(c.service),
                start: c.popup.start ?
                       Math.ceil(strtotime(c.popup.start)) : '',
                height: c.popup.height,
                width: c.popup.width,
                target: e.getTarget()
            });
        }
    };
    var onLoad = function() {
        var iGColumns = g.el.select('div.iGColumn');
        iGColumns.each(function(column) {
            column.on({
                mouseover: function(e, el) {
                    if(!task) {
                        task = new Ext.util.DelayedTask(Popup);
                    }
                    task.delay(c.popup.timeout, null, null, [e, el]);
                },
                mouseout: function() {
                    if(task) {
                        task.cancel();
                        delete task;
                    }
                },
                click: Preview
            });
        });
    };
    return {
        init: function(grid, cfg) {
            g = grid;
            s = g.getStore();
            c = cfg;
            s.on({
                load : onLoad
            });
        }
    };
}();