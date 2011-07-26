Ext.ns('Ext.iG');

Ext.iG.Viewport = Ext.extend(Ext.Viewport, {
    
    layout : 'border',
    
    constructor : function(cfg) {
    	this.tabs = new Ext.TabPanel({
            region : 'center',
            tbar : {
            	items : ['->', {
                	width : 16,
                	iconCls : 'icon-print',
                	handler : function() {
                		Ext.each(this.findByType('flotpanel'), function(fp) {
                			fp.preparePrint();
                		});
                		
                		window.print();
                	},
                	scope : this               		
            	}]
            },
            plugins : [new Ext.ux.TabScrollerMenu()],
            enableTabScroll : true,
            defaults : {
                closable : true
            }    		
    	});
    	
    	this.menu = new Ext.iG.Menu(Ext.apply(cfg, {
            region : 'north',
            height : 90,
            plugins: [new Ext.iG.TabLayout({
            	tabs : this.tabs
            })]
    	}));
    	
    	Ext.apply(cfg, {
    		items : [
    		    this.menu,
    		    this.tabs
    		]
    	});
    	
    	Ext.iG.Viewport.superclass.constructor.call(this, cfg);
    	
    	if(this.host && this.service) {
    		this.menu.hostServiceRequest(this.host, this.service, false, false);
    	} else if(this.host) {
    		this.menu.hostRequest(this.host);
		}
    }

});