Ext.ns('Ext.iG');

Ext.iG.SingleLayout =  Ext.extend(Object, {

	constructor : function(cfg) {
		cfg = cfg || {};
		Ext.apply(this, cfg);
	},
	
	init : function(menu) {
		Ext.apply(menu, this.addins);
		
		menu.iGLayout = this;
	},
	
	getContainer : function() {
		// icinga-web
		return this.single.getParent();
	},
	
	addins : {
		hostServiceRequest : function(h, s, st, et) {
	    	var frames = this.timeFrames.filter('show', true);
		        
	        if(st || et) {
	            frames.clear();
	            frames.add({
	                title : 'Custom Timerange',
	                start : iG.functor(st ? st.getTime()/1000 : ''),
	                end : iG.functor(et ? et.getTime()/1000 : Math.ceil((new Date()).getTime()/1000))
	            });
	        }

	        var panels = new Array();
	            
	        frames.each(function(frame) {         
	            panels.push({
	                xtype : 'flotpanel',
	                title : frame.title,
	                host : h,
	                service : s,
	                bodyStyle : 'padding : 5px',
	                store : new Ext.iG.FlotJsonStore({
	                    url : this.provider.plots,
	                    baseParams : {
	                        host : h,
	                        service : s,
	                        start : frame.start(),
	                        end : frame.end()
	                    }
	                }),
	                frame : frame,
	                overview : frame.overview
	            });
	        }, this);
	        
	        // icinga-web
	        this.iGLayout.getContainer().setTitle(String.format('inGraph: {0} - {1}', h, s));
	        
	        this.iGLayout.getContainer().add({
	            title : String.format('{0} - {1}', h, s),
	            header : false,
	            autoScroll : true,
	            layout : panels.length > 1 ? 'anchor' : 'absolute',
                forceLayout : true,
	            defaults : {
	                collapsible : true
	            },
	            items : panels
	        });
	        
	        this.iGLayout.getContainer().doLayout();
	        
	        // icinga-web
	        var ownerCt = this;
	        while(ownerCt.ownerCt) {
	        	ownerCt = ownerCt.ownerCt;
	        }
	        ownerCt.suspendEvents();
	        ownerCt.close();
	    },
	    
	    viewRequest : function(c) {
            var panels = new Array();

            c.title = c.title || 'View';
            
            Ext.each(c.panels, function(panelCfg) {
                var start = panelCfg.start || '';
                if(start) {
                    start = strtotime(start);
                    if(start) {
                        start = Math.ceil(start);
                    } else {
                        start = '';
                    }
                }
                var end = panelCfg.end;
                if(end) {
                    end = strtotime(end);
                    if(end) {
                        end = Math.ceil(end);
                    } else {
                        end = Math.ceil((new Date()).getTime()/1000);
                    }
                } else {
                    end = Math.ceil((new Date()).getTime()/1000);
                }
                
                var frame = {
                    title : panelCfg.title || 'Panel',
                    start : iG.functor(start),
                    end : iG.functor(end)
                };
                
                panels.push({
                    xtype : 'flotpanel',
                    layout : 'container',
                    titleFormat : '{frame}',
                    title : frame.title,
                    frame : frame,
                    bodyStyle : 'padding : 5px',
                    store : new Ext.iG.FlotJsonStore({
                        url : this.provider.combined,
                        baseParams : {
                            config : Ext.encode({
                                data : Ext.isArray(panelCfg.data) ? panelCfg.data : new Array(panelCfg.data),
                                flot : c.flot || {},
                                generic : c.generic || {}
                            }),
                            start : frame.start(),
                            end : frame.end(),
                            interval : panelCfg.interval || ''
                        }
                    })
                });
            }, this);
            
            // icinga-web
            this.iGLayout.getContainer().setTitle(c.title);
            
            this.iGLayout.getContainer().add({
                title : c.title,
                header : false,
                autoScroll : true,
                layout : panels.length > 1 ? 'anchor' : 'absolute',
                forceLayout : true,
                defaults : {
                    collapsible : true
                },
                items : panels
            });
            
            this.iGLayout.getContainer().doLayout();
            
            // icinga-web
            var ownerCt = this;
            while(ownerCt.ownerCt) {
                ownerCt = ownerCt.ownerCt;
            }
            ownerCt.suspendEvents();
            ownerCt.close();
	    },
	    
	    hostRequest : function(h) {}
	}
	
});