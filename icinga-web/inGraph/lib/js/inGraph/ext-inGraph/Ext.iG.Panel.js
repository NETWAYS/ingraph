Ext.ns('Ext.iG');
Ext.iG.Panel = (function() {
	var provider = {
        hosts: 'http://localhost/inGraph/data/hosts',
        services: 'http://localhost/inGraph/data/services',
        views: 'http://localhost/inGraph/data/views',
        plots: 'http://localhost/inGraph/data/plots',
        combined: 'http://localhost/inGraph/data/combined'
    };
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
		            		host: cfg.host,
		            		service: cfg.service,
		            		store: new Ext.iG.FlotJsonStore({
		                        url: provider.plots,
		                        baseParams: {
		                            host: cfg.host,
		                            service: cfg.service,
		                            start: strtotime(rec.get('start')),
		                            end: strtotime(rec.get('end'))
		                        }
		                    }),
		                    overview: rec.get('overview')
		            	});
		            }
		        });
		    }
		    return new Ext.Panel({
			    //layout: 'anchor',
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