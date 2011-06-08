Ext.ns('Ext.iG.Interface');

Ext.iG.Interface.Viewport = Ext.extend(Ext.Viewport, {
	
    boxMinWidth : 400,
    
    layout : 'border',
    
    constructor : function(cfg) {
    	Ext.apply(cfg, {
    		items : [{
                region : 'north',
                border : true,
                height : 90,
                xtype : 'form',
                frame : true,
                bodyStyle : 'padding:5px',
                labelAlign : 'top',
                items : [{
                    autoScroll : true,
                    layout : 'table',
                    layoutConfig : {
                        columns : 6
                    },
                    defaults : {
                        bodyStyle : 'padding:5px'
                    },
                    items : [{
                        items : {
    	                    xtype : 'autocombo',
    	                    name : 'host',
    	                    url : 'data/hosts',
    	                    plugins : [new Ext.ux.ComboController({observe : 'service'})],
    	                    emptyText : _('Choose Host'),
    	                    ref : '../../../hostCmp'
                        }
                    }, {
                        items : {
    	                    xtype : 'autocombo',
    	                    name : 'service',
    	                    url : 'data/services',
    	                    plugins : [new Ext.ux.ComboDependency({depends : {host : 'host'}})],
    	                    disabled : true,
    	                    emptyText : _('Choose Service'),
    	                    ref : '../../../serviceCmp'
                        }
                    }, {
                        items : {
    	                    xtype : 'button',
    	                    text : _('Display Graph'),
    	                    width : 80,
                            cls : 'x-btn-text-left',
                            handler : function(self, e) {
                            	var h = this.hostCmp.getValue(),
	                            	s = this.serviceCmp.getValue(),
	                            	st = this.startCmp.getValue(),
	                            	et = this.endCmp.getValue();
                            	
                            	if(h && s) {
                            		this.addHostServiceTab(h, s, st, et);
                            	}
                            },
                            scope : this
                        }
                    }, {
                        items : {
    	                    xtype : 'datefield',
    	                    format : 'Y-m-d H:i:s',
    	                    id : 'iG-Start',
    	                    fieldLabel : 'Start',
    	                    width : 150,
    	                    emptyText : _('Starttime'),
    	                    ref : '../../../startCmp'
                        }
                    }, {
                        items : {
    	                    xtype : 'datefield',
    	                    format : 'Y-m-d H:i:s',
    	                    id : 'iG-End',
    	                    fieldLabel : 'End',
    	                    width : 150,
    	                    emptyText : _('Endtime'),
    	                    ref : '../../../endCmp'
                        }
                    }, {
                        items : {
    	                    xtype : 'box',
    	                    autoEl : {
    	                        tag : 'div'
    	                    }
                        },
                        rowspan : 2
                    }, {
                        items : {
    	                    xtype : 'autocombo',
    	                    name : 'view',
    	                    url : 'data/views',
    	                    emptyText : _('Choose View'),
                            storeCfg : {
                                fields : ['view', 'config']
                            },
    	                    width : 490,
    	                    ref : '../../../viewCmp'
                        },
                        colspan : 2
                    }, {
                        items : {
    	                    xtype : 'button',
    	                    text : _('Display View'),
    	                    width : 80,
                            cls : 'x-btn-text-left',
                            handler : function(self, e) {
                            	var v = this.viewCmp.getValue();
                            	
                            	if(v) {
                            		this.addViewTab(this.viewCmp.store.getById(v).get('config'));
                            	}
                            },
                            scope : this
                        }
                    }]
                }]
            }, {
                region : 'center',
                xtype : 'tabpanel',
                plugins : [new Ext.ux.TabScrollerMenu()],
                enableTabScroll : true,
                ref : 'tabs',
                defaults : {
                    closable : true
                }
            }]
    	});
    	
    	Ext.iG.Interface.Viewport.superclass.constructor.call(this, cfg);
    },
    
    addHostServiceTab : function(h, s, st, et) {
        var frames = iG.timeFrames.getDefault();
        
        if(st || et) {
            frames.clear();
            frames.add({
                title : 'Custom Timerange',
                start : iG.functor(st ? st.getTime()/1000 : ''),
                end : iG.functor(et ? et.getTime()/1000 : Math.ceil((new Date()).getTime()/1000))
            });
        }
        
        var tab = this.tabs.items.find(function(t) {
            return t.title === '{0} - {1}'.format(h, s);
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
                store : new Ext.ux.FlotJsonStore({
                    url : 'data/plots',
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
        });
        
        tab = this.tabs.add({
            title : '{0} - {1}'.format(h, s),
            header : false,
            autoScroll : true,
            defaults : {
                collapsible : true
            },
            items : panels
        });

        this.tabs.setActiveTab(tab);    	
    },
    
    addViewTab : function(c) {
        var panels = new Array();

	    c.title = c.title || 'View';
	    
	    var tab = this.tabs.items.find(function(t) {
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
	            store : new Ext.ux.FlotJsonStore({
	                url : 'data/combined',
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
	    });
	
	    tab = this.tabs.add({
	        title : c.title,
	        header : false,
	        autoScroll : true,
	        defaults : {
	            collapsible : true
	        },
	        items : panels
	    });
	
	    this.tabs.setActiveTab(tab);
    }

});