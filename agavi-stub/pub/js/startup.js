Ext.ns("Ext.App.InGraph");

Ext.App.InGraph.Classic = {
	viewport : null,
	
    init : function() {
    	Ext.BLANK_IMAGE_URL = 'images/s.gif';
    	
    	Ext.QuickTips.init();
    	
    	this.viewport = new Ext.Viewport({
    		layout : 'border',
    		renderTo : 'content',
    		items : [{
    			region : 'north',
    			xtype : 'panel',
    			title : 'TOP',
    			html : 'TOP PANEL',
    			height : 100
    		}, {
    			region : 'center',
    			xtype : 'panel',
    			title : 'CENTER',
    			html : 'CENTER PANEL'
    		}]
    	});
    	
    	this.viewport.render();
    	
    	this.viewpoer.doLayout();
    }
};

Ext.onReady(Ext.App.InGraph.Classic.init, Ext.App.InGraph.Classic);