Ext.ns('Ext.iG');

Ext.iG.FlotPanel = Ext.extend(Ext.Panel, {
	
	loadMask: true,
	
	overview: false,
	
	titleFormat: String.format('{frame} {0} {host} {service}', _('graph for')),
	
	zoomSteps: 3,
	
	zoomMax: 5*60*1000,
	
	constructor: function(cfg) {
		cfg = cfg || {};
		
		Ext.apply(cfg, {
			layout      : typeof cfg.overview !== 'undefined' ? (cfg.overview ? 'anchor' : 'fit') : (this.overview ? 'anchor' : 'fit'),
			animCollapse: true,
            tbar        : {
            	defaults: {
            		height    : 33
            	},
                items   : [/*{
                    xtype   	: 'timeframebuttongroup',
                    active		: cfg.frame.id,
                    listeners	: {
                    	framechange	: function(frame) {
                    		this.frame = frame;
                    	
	                        this.setTitle(String.format(this.titleFormat, {
	                            host       : this.host,
	                            service    : this.service,
	                            frame      : this.frame.title
	                        }));
	                        
	                        Ext.iterate({
	                        	start : frame.start(),
	                        	end   : frame.end()
	                        }, function(k, v) {
	                        	this.store.setBaseParam(k, v);
	                        }, this);

                    		this.store.load({
                    			callback : function() {
                    				if(this.overview) {
	                    				this.overview.getFlot().setSelection(
	                    				    this.flot.getRange(),
	                    				    true
	                    				);
                    				}
                    			},
                    			scope : this
                    		});
                    	},
                    	scope		: this
                    },
                    ref			: '../timeframes'
                },*/ {
                    xtype   : 'buttongroup',
                    items   : [{
                    	xtype      : 'checkbox',
                    	disabled   : true,
                    	boxLabel   : _('Show datapoints'),
                    	handler    : function(box, checked) {
                    		var flot = this.flot;
                    		iG.merge(true, flot.flotOptions, {
                    			series: {
                    				points: {
                    					show: checked
                    				}
                    			}
                    		});
                    		flot.refresh();
                    	},
                    	scope      : this,
                    	ref        : '../../datapoints'
                    }, {
                        xtype      : 'checkbox',
                        disabled   : true,
                        boxLabel   : _('Smooth'),
                        handler    : function(box, checked) {
                            var flot = this.flot;
                            iG.merge(true, flot.flotOptions, {
                                series: {
                                    lines: {
                                        spline: checked
                                    }
                                }
                            });
                            flot.refresh();
                        },
                        scope      : this,
                        ref        : '../../smooth'
                    }]
                }, {
                	xtype   : 'buttongroup',
                	items   : [{
                        text    : 'Template',
                        handler : function(button, event) {
                            var c = new Array();

                            var store   = this.flot.getStore(),
                                ostore  = null;

                            if(this.overview) {
                                var ostore = this.overview.getStore();
                            }
                            
                            store.each(function(record) {
                                c.push({
                                    checked     : !record.get('disabled'),
                                    name        : record.get('label'),
                                    fieldLabel  : record.get('label'),
                                    handler     : function(box, checked) {
                                        store.getAt(store.find('label', box.name)).set('disabled', !checked);
                                        
                                        if(ostore) {
                                            ostore.getAt(store.find('label', box.name)).set('disabled', !checked);
                                        }
                                    }
                                });
                            });
                            
                            if(!this.templateWindow) {
                            	/*
                            	this.templateWindow = new Ext.Window({
                            		items: new Ext.iG.Settings({
                            			store: this.store
                            		})
                            	});*/                 	    

	                            this.templateWindow = new Ext.iG.TemplateWindow({
	                            	store : this.store,
	                            	listeners : {
	                            		sourcechange : function(w, h, s) {
                            				this.flot.resetTemplate();
                          				  
                            				Ext.apply(this.store.baseParams, {
                            					host : h,
                            					service : s
                            				});
                            				
                            				this.store.removeAll(true);
                            				
                            				this.host = h;
                            				this.service = s;
                            				
                            				this.store.load();
                            				
                            				if(this.overview) {
                            					var r = this.overview.flot.getSelection();
                            					
                            					this.overview.resetTemplate();
                            					
                                                Ext.apply(this.overview.store.baseParams, {
                                                    host : h,
                                                    service : s
                                                });
                                                
                                                this.overview.store.removeAll(true);
                                                
                                                this.overview.host = h;
                                                this.overview.service = s;
                                                
                                                this.overview.store.load(r ? {
                                                	callback : function() {
                                                		this.flot.setSelection(r);
                                                	},
                                                	scope : this.overview
                                                } : {});
                            				}	                            			
	                            		},
	                            		scope : this
	                            	}
	                            });
                            }

                            this.templateWindow.show();
                        },
                        scope   : this
	                }, {
	                	xtype : 'splitbutton',
	                	text : _('Options'),
	                   	menu : {
	                   		layout : 'form',
	                        items: {
	                        	xtype : 'slider',
	                        	fieldLabel : _('Null tolerance'),
	                        	increment : 5,
	                        	minValue : 0,
	                        	maxValue : 100,
	                        	value : 10,
	                        	width : 100,
	                        	plugins : [new Ext.ux.SliderTip()],
	                        	listeners : {
	                        		changecomplete : function(slider, v) {
	                        			this.store.setBaseParam('nullTolerance', v);
	                        			this.store.load();
	                        			if(this.overview) {
		                        			this.overview.getStore().setBaseParam('nullTolerance', v);
		                        			this.overview.getStore().load();	                        				
	                        			}
	                        		},
	                        		scope : this
	                        	}
	                        }
	                   	}
	                }]
                }, {
                    xtype   : 'buttongroup',
                    items   : [{
                    	width : 16,
                    	iconCls : 'icon-zoom-in',
                    	handler : function() {
                    		var r = this.flot.getRange(),
                    			i = r.xaxis.to - r.xaxis.from,
                    			s = Math.ceil(i / (this.zoomSteps));
                    		
                    		if(i <= this.zoomMax) {
                    			return;
                    		}
                    		
                    		r.xaxis.from += s;
                    		r.xaxis.to -= s;
                    		
                    		this.flot.select(r);
                    	},
                    	scope : this
                    }, {
                    	width : 16,
                    	iconCls : 'icon-zoom-out',
                    	handler : function() {
                    		this.flot.unselect();
                    	},
                    	scope : this
                    }]
                }, '->', {
                	width : 16,
                	iconCls : 'icon-print',
                	handler : function() {
                		this.preparePrint();
                		
                		window.print();
                	},
                	scope : this
                }]
            },
            defaults    : {
                xtype   : 'flot',
                height  : 300,
                layout : 'container'
            }
		});
		
		Ext.iG.FlotPanel.superclass.constructor.call(this, cfg);
	},
	
	initComponent	: function() {
		Ext.iG.FlotPanel.superclass.initComponent.call(this);
		
		this.title = String.format(this.titleFormat, {
            host    : this.host,
            service : this.service,
            frame   : this.title
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
        this.store.on({
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
        	    height      : 50,
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
        				this.timeframes.noneActive();
        				
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
	                    
	                    this.timeframes.setActive(this.frame.id);
	
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