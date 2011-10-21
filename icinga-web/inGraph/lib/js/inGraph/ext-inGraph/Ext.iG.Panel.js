Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Panel
 * @extends Ext.Panel
 */
Ext.iG.Panel = Ext.extend(Ext.Panel, {
	header: false,
	autoScroll: true,
	stateful: true,
	stateEvents: [],
	defaults: {
		xtype: 'flotpanel',
		bodyStyle: 'padding: 5px;'
	},
	
	initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.Panel.superclass.initComponent.call(this);
	},
	
	fromViewConfig: function(cfg) {
        if(this.viewConfig) {
        	var items = new Array();
            cfg.title = this.viewConfig.title || _('View (No Title)');
            Ext.each(this.viewConfig.panels, function(pcfg) {
                items.push({
                    titleFormat: '{interval}',
                    title: pcfg.title || _('Panel (No Title)'),
                    store: new Ext.iG.FlotJsonStore({
                        url: this.provider.combined,
                        baseParams: {
                            config: Ext.encode({
                                data: Ext.isArray(pcfg.data) ?
                                      pcfg.data : new Array(pcfg.data),
                                flot: this.viewConfig.flot || {},
                                generic: this.viewConfig.generic || {}
                            }),
                            start: pcfg.start ?
                                   Math.ceil(strtotime(pcfg.start)) : '',
                            end: pcfg.end ?
                                 Math.ceil(strtotime(pcfg.end)) :
                                 Math.ceil(new Date().getTime()/1000),
                            interval: pcfg.interval || ''
                        }
                    })
                });
            }, this);
            cfg.items = items;
            return true;
        }
        return false;
	},
	
	fromView: function(cfg) {
		return false;
	},
	
	fromHost: function(cfg) {
		if(this.host && !this.service) {
            cfg.title = _('Services For') + ' ' + this.host;
            cfg.items = new Ext.iG.HostSummary({
                provider: this.provider,
                host: this.host
            });
            return true;
		}
		return false;
	},
	
	fromHostService: function(cfg) {
		if(this.host && this.service) {
			var items = new Array();
			cfg.title = this.host + ' - ' + this.service;
            if(this.start || this.end) {
                items.push({
                    title: this.start + ' - ' + this.end,
                    host: this.host,
                    service: this.service,
                    store: new Ext.iG.FlotJsonStore({
                        url: this.provider.plots,
                        baseParams: {
                            host: this.host,
                            service: this.service,
                            start: this.start,
                            end: this.end
                        }
                    })
                });
            } else {
                this.timeFrames.each(function(rec) {
                    if(rec.get('enabled')) {
                        items.push({
                            title: rec.get('name'),
                            activeFrame: rec.get('name'),
                            host: this.host,
                            service: this.service,
                            store: new Ext.iG.FlotJsonStore({
                                url: this.provider.plots,
                                baseParams: {
                                    host: this.host,
                                    service: this.service,
                                    start: Math.ceil(
                                        strtotime(rec.get('start'))),
                                    end: Math.ceil(strtotime(rec.get('end')))
                                }
                            }),
                            overview: rec.get('overview')
                        });
                    }
                }, this);
            }
            cfg.items = items;
            return true;
		}
		return false;
	},
	
	buildItems: function(cfg) {
		var items = new Array();
		Ext.each([this.fromViewConfig, this.fromView, this.fromHost,
				  this.fromHostService], function(fn) {
			return !fn.call(this, cfg);
		}, this);
	},
	
    getState: function() {
        var panels = new Array();
        this.items.each(function(panel) {
        	panels.push(panel.getState());
        });
        return {
        	panels: panels
        };
    },
	
    applyState: function(state) {
    	Ext.each(state.panels, function(panel) {
    		if(panel.store) {
    			panel.store = new Ext.iG.FlotJsonStore(panel.store);
    		}
    		this.add(panel);
    	}, this);
    }
});