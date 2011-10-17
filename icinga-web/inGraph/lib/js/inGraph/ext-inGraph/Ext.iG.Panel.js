Ext.ns('Ext.iG');
Ext.iG.Panel = (function() {
	return {
		hostService: function(cfg, timeFrames) {
		    var items = new Array();
		    if(cfg.start || cfg.end) {
                items.push({
                    title: 'RANGE',
                    host: cfg.host,
                    service: cfg.service,
                    store: new Ext.iG.FlotJsonStore({
                        url: provider.plots,
                        baseParams: {
                            host: cfg.host,
                            service: cfg.service,
                            start: cfg.start,
                            end: cfg.end
                        }
                    })
                });
		    } else {
		        timeFrames.each(function(rec) {
		            if(rec.get('enabled')) {
		            	items.push({
		            		title: rec.get('name'),
		            		activeFrame: rec.get('name'),
		            		host: cfg.host,
		            		service: cfg.service,
		            		store: new Ext.iG.FlotJsonStore({
		                        url: cfg.provider.plots,
		                        baseParams: {
		                            host: cfg.host,
		                            service: cfg.service,
		                            start: Math.ceil(
		                                strtotime(rec.get('start'))),
		                            end: Math.ceil(strtotime(rec.get('end')))
		                        }
		                    }),
		                    overview: rec.get('overview')
		            	});
		            }
		        });
		    }
		    return new Ext.Panel({
			    header: false,
			    autoScroll: true,
			    defaults: {
			        xtype: 'flotpanel'
			    },
			    items: items
		    });
		}
	}
})();