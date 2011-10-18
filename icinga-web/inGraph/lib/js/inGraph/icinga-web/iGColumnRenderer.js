Ext.ns('Cronk.grid.iGColumnRenderer');
Cronk.grid.iGColumnRenderer = function() {
	var g,
	    s,
	    c,
	    task;
	var doPreview = function(el) {
		var row = g.getView().findRowIndex(el);
		if(row !== false) {
			var rec = s.getAt(row),
			    host = rec.get(c.host),
			    service = rec.get(c.service),
			    title = new Ext.XTemplate(c.title).apply(rec.data),
			    preview = new Ext.Window({
			    	title: title,
			    	layout: 'fit',
			    	height: c.height,
			    	width: c.width,
			    	items: new Ext.iG.Flot({
			    		loadMask: false,
			    		host: host,
			    		service: service,
			    		store: new Ext.iG.FlotJsonStore({
			    			url: AppKit.util.Config.getBaseUrl() + '/' +
			    			     'modules/ingraph/provider/plots',
			    			baseParams: {
			    				host: host,
			    				service: service
			    			}
                        })
			    	})
			    });
			preview.show();
		}
	};
	var openCronk = function(e, el) {
        var row = g.getView().findRowIndex(el);
        if(row !== false) {
            var rec = s.getAt(row),
                host = rec.get(c.host),
                service = rec.get(c.service),
                title = new Ext.XTemplate(c.title).apply(rec.data),
                cronk = {
		            id: Ext.id(),
		            title: title,
		            crname: 'inGraph',
		            iconCls: 'icinga-cronk-icon-stats2',
		            closable: true,
		            params: {
		                host: host,
		                service: service
		            }	
                },
                tabs = Ext.getCmp('cronk-tabs'),
                panel = Cronk.factory(cronk);
	        tabs.add(panel);
	        tabs.setActiveTab(panel);
        }
	};
	var onLoad = function() {
        var iGColumns = g.el.select('div.iGColumn');
        iGColumns.each(function(column) {
        	column.on({
        		mouseover: function(e, el) {
        			if(!task) {
        				task = new Ext.util.DelayedTask(doPreview);
        			}
        			task.delay(c.previewTimeout, null, null, [el]);
        		},
        		mouseout: function() {
        			if(task) {
        				task.cancel();
        				delete task;
        			}
        		},
        		click: openCronk
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