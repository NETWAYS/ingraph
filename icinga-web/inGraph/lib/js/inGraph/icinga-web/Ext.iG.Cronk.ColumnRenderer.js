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
	var doPreview = function(el) {
		var row = g.getView().findRowIndex(el);
		if(row !== false) {
			var rec = s.getAt(row);
			Ext.iG.Cronk.preview({
                title: new Ext.XTemplate(c.title).apply(rec.data),
                host: rec.get(c.host),
                service: rec.get(c.service),
                height: c.height,
                width: c.width
			});
		}
	};
	var openCronk = function(e, el) {
        var row = g.getView().findRowIndex(el);
        if(row !== false) {
            var rec = s.getAt(row);
            Ext.iG.Cronk.open({
            	title: new Ext.XTemplate(c.title).apply(rec.data),
            	host: rec.get(c.host),
            	service: rec.get(c.service)
            });
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