Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Panel
 * @extends Ext.Panel
 */
Ext.iG.Panel = Ext.extend(Ext.Panel, {
	header: false,
	autoScroll: true,
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
	
	buildItems: function(cfg) {
		var items = new Array();
		if(this.viewConfig) {
			var vcfg = this.viewConfig;
			this.title = vcfg.title || _('View (No Title)');
            Ext.each(vcfg.panels, function(pcfg) {
                items.push({
                	titleFormat: '{interval}',
                	title: pcfg.title || _('Panel (No Title)'),
                	store: new Ext.iG.FlotJsonStore({
                		url: this.provider.combined,
                		baseParams: {
                			config: Ext.encode({
                				data: Ext.isArray(pcfg.data) ?
                				      pcfg.data : new Array(pcfg.data),
                				flot: vcfg.flot || {},
                				generic: vcfg.generic || {}
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
		} else if(this.view) {
		} else if(!this.service) {
			this.title = _('Services For') + ' ' + this.host;
            items.push(new Ext.iG.HostSummary({
                provider: this.provider,
                host: this.host
            }));
		} else {
			this.title = this.host + ' - ' + this.service;
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
		} // eof host and service
		cfg.items = items;
	},
});