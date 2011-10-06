Ext.ns('Cronk.grid.ColumnRenderer');
(function() {

    var buildLink = function(data, cfg) {
    	var host = data[cfg.host],
    	    service = data[cfg.service],
    	    title = new Ext.XTemplate(cfg.title);
    	    
        var cronk = {
            id : Ext.id(),
            title : title.apply(data),
            crname : 'inGraph',
            iconCls : 'icinga-cronk-icon-stats2',
            closable : true,
            params : {
                host : host,
                service : service
            }
        };
        
        var tabs = Ext.getCmp('cronk-tabs');
        var panel = Cronk.factory(cronk);
        
        tabs.add(panel);
        tabs.setActiveTab(panel);
    };
    
    Cronk.grid.ColumnRenderer.iGColumn = function(cfg) {
        return function(grid, rowIndex, colIndex, e) {
                var fieldName = grid.getColumnModel().getDataIndex(colIndex);
                if (fieldName == cfg.field) {
                	var record = grid.getStore().getAt(rowIndex);
                	buildLink(record.data, cfg)       	
                }
        }
    };
})();
