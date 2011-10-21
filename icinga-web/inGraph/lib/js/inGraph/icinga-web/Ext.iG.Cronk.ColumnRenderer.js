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