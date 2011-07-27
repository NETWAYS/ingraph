Ext.ns('Ext.iG');

Ext.iG.TabLayout =  Ext.extend(Object, {

	constructor : function(cfg) {
		cfg = cfg || {};
		Ext.apply(this, cfg);
	},
	
	init : function(menu) {
		Ext.apply(menu, this.addins);
		
		menu.tabLayout = this;
	},
	
	getTabs : function() {
		return this.tabs;
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
	        
	        var tab = this.tabLayout.getTabs().items.find(function(t) {
	            return t.title === String.format('{0} - {1}', h, s);
	        });

	        if(tab) {
	            Ext.destroy(tab);
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
	        
	        tab = this.tabLayout.getTabs().add({
	            title : String.format('{0} - {1}', h, s),
	            header : false,
	            autoScroll : true,
	            defaults : {
	                collapsible : true
	            },
	            items : panels
	        });

	        this.tabLayout.getTabs().setActiveTab(tab);    	
	    },
	    
	    viewRequest : function(c) {
	        var panels = new Array();

		    c.title = c.title || 'View';
		    
		    var tab = this.tabLayout.getTabs().items.find(function(t) {
		        return t.title === c.title;
		    });
		    
		    if(tab) {
		        Ext.destroy(tab);
		    }
		    
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
		
		    tab = this.tabLayout.getTabs().add({
		        title : c.title,
		        header : false,
		        autoScroll : true,
		        defaults : {
		            collapsible : true
		        },
		        items : panels
		    });
		
		    this.tabLayout.getTabs().setActiveTab(tab);
	    },
	    
	    hostRequest : function(h) {
		    var tab = this.tabLayout.getTabs().add(new Ext.iG.HostSummary({
		    	provider : this.provider,
				host : h,
				height : 200,
				limit : 20,
				title : String.format('{0} {1}', _('Services for'), h),
				listeners : {
					click : function(hs, index, node) {
						var service = hs.getRecord(node).get('service'),
							frames = iG.timeFrames.getDefault(),
							tab = this.tabLayout.getTabs().items.find(function(t) {
								return t.title === String.format('{0} - {1}', hs.host, service);
							}),
							panels = new Array();
							
						if(tab) {
							Ext.destroy(tab);
						}
						
						frames.each(function(frame) {         
							panels.push({
								xtype : 'flotpanel',
								title : frame.title,
								host : hs.host,
								service : service,
								bodyStyle : 'padding : 5px',
								store : new Ext.iG.FlotJsonStore({
									url : this.provider.plots,
									baseParams : {
										host : hs.host,
										service : service,
										start : frame.start(),
										end : frame.end()
									}
								}),
								frame : frame,
								overview : frame.overview
							});
						}, this);
							
						tab = this.tabLayout.getTabs().add({
							title : String.format('{0} - {1}', hs.host, service),
							header : false,
							autoScroll : true,
							defaults : {
								collapsible : true
							},
							items : panels
						});
						
						this.tabLayout.getTabs().setActiveTab(tab);
					},
					scope : this
				}
		    }));
		
		    this.tabLayout.getTabs().setActiveTab(tab);
	    }
	}
	
});