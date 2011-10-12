Ext.ns('Ext.iG');
Ext.iG.FlotPanel = Ext.extend(Ext.Panel, {
	loadMask: true,
	overview: false,
	titleFormat: '{interval} ' + _('graph for') + ' {host} {service}',
	collapsible: true,
	animCollapse: true,
	layout: 'anchor',
	defaults: {
		xtype: 'flot',
		height: 220,
		layout: 'fit'
	},
	zoomSteps: 3,
	zoomMax: 5*60*1000,
	
	constructor: function(cfg) {
		cfg = cfg || {};
		
		cfg.tbar = new Ext.iG.Toolbar({
			store: cfg.store
		});
		
		Ext.iG.FlotPanel.superclass.constructor.call(this, cfg);
	},
	
	initComponent: function() {
		Ext.iG.FlotPanel.superclass.initComponent.call(this);
		
		this.title = String.format(this.titleFormat, {
            host    : this.host,
            service : this.service,
            interval   : this.title
        });
		
        this.store = Ext.StoreMgr.lookup(this.store);
        this.store.on({
        	load: { 
        	    fn: function(store, records) {
        	    	if(!records.length) {
	        			this.collapse.defer(500, this, [true], true);
	        		}
        	    },
        	    single: true
        	},
        	beforeautorefresh: {
        		fn: function() {
        			if(this.ownerCt.hidden) {
        				return false;
        			}
        		}
        	},
        	scope: this
        });
        /*this.store.on({
            load    : { 
                fn     : function(store, records) {
                    if(records.length) {
                        this.setTitle(String.format(this.titleFormat, {
                            host    : this.host,
                            service : this.service,
                            frame   : this.initialConfig.title
                        }));
                            
                        this.datapoints.enable();
                        this.smooth.enable();
                    } else {
                    	this.setTitle(String.format(this.titleFormat + ' ({0})', {
                    		host      : this.host,
                    		service   : this.service,
                    		frame     : this.initialConfig.title
                    	}, _('No data')));
                    	
                        this.datapoints.disable();
                        this.smooth.disable();
                    }
                }
            },
            scope   : this
        });*/
        
        this.add({
        	store	: this.store,
        	ref		: 'flot'
        });
        
        if(this.overview) {
        	this.add([{
        		xtype   : 'container',
        		height: 1,
        		autoEl  : {
        			tag : 'hr',
        			cls : 'iG-hs'
        		}
        	}, {
        		autoAddYAxes : false,
        	    flotOptions : {
        	        xaxis       : {
        	            show       : true,
        	            mode       : 'time',
        	            ticks      : function(axis) {
        	            	var ticks = new Array(),
        	            	    c     = 4;
        	            	
        	            	if(c) {
        	            		var range = axis.max - axis.min,
        	            		    delta = range / (c-1);
        	            		    
        	            		for(var i=0; i <= c; ++i) {
        	            			ticks.push(axis.min + delta*i);
        	            		}
        	            	}
        	            	
        	            	return ticks;
        	            }
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
        	    height      : 40,
        	    store       : new Ext.iG.FlotJsonStore({
        	    	url			: this.store.url,
        	    	baseParams	: Ext.applyIf({
        	    		start	: '',
        	    		end		: ''
        	    	}, this.store.baseParams)
        	    }),
        	    ref			: 'overview'
        	}]);
        	
        	this.flot.on({
        		zoomin	: function(flot, ranges) {
        			this.overview.getFlot().setSelection(ranges, true);
        		},
        		zoomout : function(flot, ranges) {
        			if(ranges) {
            			this.overview.getFlot().setSelection(ranges, true);       				
        			} else {
        				this.overview.getFlot().clearSelection();
        			}
        		},
        		scope			: this
        	});
        	
        	this.overview.on({
        		plotselected: {
        			fn		: function(flot, event, ranges) {
        				//this.timeframes.noneActive();
        				
                        var store = this.flot.getStore();
                        if(ranges) {
                        	Ext.iterate({
                                start : Math.ceil(ranges.xaxis.from/1000),
                                end   : Math.ceil(ranges.xaxis.to/1000)
                            }, function(k, v) {
                                this.store.setBaseParam(k, v);
                            }, this);

                            this.store.load();
                        }
                        
                        if(flot.shint) {
                        	flot.shint.hide.defer(500, flot.shint);
                        }
                        
                        return false;
        			}
        		},
                contextmenu: {
                	fn     : function(flot, event) {
	                    event.stopEvent();

                        Ext.iterate({
                            start : this.frame.start(),
                            end   : this.frame.end()
                        }, function(k, v) {
                            this.store.setBaseParam(k, v);
                        }, this);
                        
	                    this.store.load();
	                    
	                    flot.getFlot().clearSelection();
	                    
	                    //this.timeframes.setActive(this.frame.id);
	
	                    return false;
                	}
                },
                plotselecting: {
                	fn     : function(flot, event, pos, ranges) {
                		if(!ranges || !ranges.xaxis) {
                			return;
                		}
                		flot.showSelectionHint(pos, ranges);
                		
                		var series = new Array();
                		
                		flot.getStore().each(function(record) {
			                if(!record.get('disabled')) {
			                    var r = record.copy();

		                        var data = Ext.toArray(r.get('data')).filter(function(xy) {
		                            if(xy[0] >= ranges.xaxis.from && xy[0] <= ranges.xaxis.to) {
		                                return true;
		                            }
		                            return false;
		                        });
		                        
		                        if(data.length) {
		                        	r.set('data', data);
		                        	series.push(r);
		                        }
			                }
			            }, this);
			            
			            Ext.apply(this.store.reader.jsonData, {
			            	start   : Math.ceil(ranges.xaxis.from/1000),
			            	end     : Math.ceil(ranges.xaxis.to/1000)
			            });
			            
			            this.store.removeAll(true);
			            this.store.add(series);
			            this.store.fireEvent('load', this.store, series);
                	}
                },
                refresh: {
                	fn     : function(flot) {
                		Ext.select('.tickLabel', false, flot.el.id).each(function(el) {
                			var o = 40;
                			el.setLeft(el.getLeft() > 0 ? el.getLeft()-o-10 : el.getLeft()+o);
                		}, this);
                	}
                },
        		scope	: this
        	});
        }
	},
	
	initEvents: function() {
		Ext.iG.FlotPanel.superclass.initEvents.call(this);
		
		if(this.loadMask) {
            this.loadMask = new Ext.LoadMask(this.bwrap,
                Ext.apply({
	                store: this.store,
	                removeMask: true
	            }, this.loadMask)
            );
		}
	},
	
    onDestroy: function() {
        Ext.iG.FlotPanel.superclass.onDestroy.call(this);
        
        if(this.templateWindow) {
        	this.templateWindow.destroy();
        }
    },
    
    preparePrint : function() {
		var id = String.format('{0}-print', this.id),
			el = Ext.DomHelper.append(Ext.getBody(), {
			tag : 'div',
			cls : 'flot-print-container',
			children : [{
				tag : 'div',
				cls : 'flot-print-title',
				html : this.title,
			}, {
				tag : 'div',
				id : id,
				cls : 'flot-print-graph',
				style : {
					width : '670px',
					height : '170px'
				}
			}]
		}, true);
	
		this.flot.plot(this.flot.getSeries(), id);
		
		Ext.EventManager.addListener(window, 'focus', function() {Ext.destroy.defer(1000, this, [el]);}, this, {single : true});  	
    }

});

Ext.reg('flotpanel', Ext.iG.FlotPanel);