Ext.ux.FlotPanel = Ext.extend(Ext.Panel, {
	
	loadMask		: false,
	
	overview		: true,
	
	constructor		: function(cfg) {
		cfg = cfg || {};
		
		Ext.apply(cfg, {
			animCollapse: true,
            tbar        : {
            	defaults: {
            		height    : 33
            	},
                items   : [{
                    xtype   	: 'timeframebuttongroup',
                    active		: cfg.frame.id,
                    listeners	: {
                    	framechange	: function(frame) {
                    		if(this.overview) {
                    			this.overview.getFlot().setSelection({
                    				xaxis: {from: frame.start}
                    			});
                    		}
                    		
                    		this.setTitle(frame.title);
                    		this.store.load({
                    			params	: {
                    				start	: frame.start,
                    				end		: frame.end
                    			}
                    		});
                    	},
                    	scope		: this
                    },
                    ref			: '../timeframes'
                }, {
                    xtype   : 'buttongroup',
                    items   : [{
                    	xtype      : 'menucheckitem',
                    	disabled   : true,
                    	text       : _('Show datapoints'),
                    	handler    : function(item, event) {
                    		var flot = this.flot;
                    		flot.flotOptions.series.points.show = !item.checked;
                    		flot.refresh();
                    		
                    		item.setChecked(!item.checked);
                    	},
                    	scope      : this,
                    	ref        : '../../datapoints'
                    }]
                }]
            },
            defaults    : {
                xtype   : 'flot',
                height  : 300
            }
		});
		
		Ext.ux.FlotPanel.superclass.constructor.call(this, cfg);
	},
	
	initComponent	: function() {
		Ext.ux.FlotPanel.superclass.initComponent.call(this);
		
        this.store = Ext.StoreMgr.lookup(this.store);
        this.store.on({
        	load	: { 
        	    fn     : function(store, records) {
        	    	if(!records.length) {
	        			this.collapse.createSequence(function() {
	        				this.setTitle('{0} ({1})'.format(this.title, _('No data')));
	        			}, this).defer(500, this, [true], true);
	        		}
        	    },
        	    single : true
        	},
        	scope	: this
        });
        this.store.on({
            load    : { 
                fn     : function(store, records) {
                    if(records.length) {
                        this.datapoints.enable();
                    } else {
                        this.datapoints.disable();
                    }
                }
            },
            scope   : this
        });
        
        this.add({
        	store	: this.store,
        	ref		: 'flot'
        });
        
        if(this.overview) {
        	this.add([{
        		xtype   : 'component',
        		autoEl  : {
        			tag : 'hr',
        			cls : 'iG-hs'
        		}
        	}, {
        	    flotOptions : {
        	        xaxis       : {
        	            show: false
        	        },
        	        yaxis       : {
        	            show: false
        	        },
        	        legend      : {
        	            show: false
        	        },
        	        grid        : {
        	            show        : true,
        				borderWidth : 1,
        				borderColor : 'rgba(255, 255, 255, 0)',
        	            hoverable   : false
        	        },
        	        selection   : {
        	            mode    : 'x',
        	            color   : '#FA5C0D'
        	        }
        	    },
        	    height      : 50,
        	    store       : new Ext.ux.FlotJsonStore({
        	    	url			: this.store.url,
        	    	baseParams	: Ext.applyIf({
        	    		start	: '',
        	    		end		: ''
        	    	}, this.store.baseParams)
        	    }),
        	    ref			: 'overview'
        	}]);
        	
        	this.flot.on({
        		plotselected	: function(flot, event, ranges) {
        			this.timeframes.noneActive();
        			
        			this.overview.getFlot().setSelection({
        				xaxis	: ranges.xaxis
        			}, true);
        		},
        		scope			: this
        	});
        	
        	this.overview.on({
        		plotselected: {
        			fn		: function(flot, event, ranges) {
        				this.timeframes.noneActive();
        				
                        var store = this.flot.getStore();
                        if(ranges) {
                            store.load({
                                params: {
                                    start : Math.ceil(ranges.xaxis.from/1000),
                                    end   : Math.ceil(ranges.xaxis.to/1000)
                                }
                            });
                        }
                        
                        return false;
        			}
        		},
                contextmenu: {
                	fn     : function(flot, event) {
	                    event.stopEvent();
	                    
	                    var store = this.flot.getStore();
	                    store.load();
	                    
	                    flot.getFlot().clearSelection();
	
	                    return false;
                	}
                },
        		scope	: this
        	});
        }
	}

});

Ext.reg('flotpanel', Ext.ux.FlotPanel);