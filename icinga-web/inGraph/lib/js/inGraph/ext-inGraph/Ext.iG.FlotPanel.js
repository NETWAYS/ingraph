Ext.ns('Ext.iG');
Ext.iG.FlotPanel = Ext.extend(Ext.Panel, {
	loadMask: true,
	overview: false,
	titleFormat: '{interval} ' + _('graph for') + ' {host} {service}',
	collapsible: true,
	animCollapse: true,
	layout: 'anchor',
	defaults: {
		layout: 'fit'
	},
	
	constructor: function(cfg) {
		cfg = cfg || {};
		var items = [this.flot = new Ext.iG.Flot({
			store: cfg.store,
			height: 220
		})];
		if(cfg.overview !== undefined ? cfg.overview : this.overview) {
			delete cfg.overview;
			items.push({
				xtype: 'container',
                height: 1,
                autoEl: {
                    tag: 'hr',
                    cls: 'iG-hs'
                }
            });
			items.push(this.overview = new Ext.iG.Flot({
				flotOptions: {
                    xaxis: {
                        ticks: function(axis) {
                            var ticks = new Array(),
                                c = 4;
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
                    yaxis: {
                        show: false
                    },
                    legend: {
                        show: false
                    },
                    grid: {
                        show: true,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0)',
                        hoverable: false
                    },
                    selection: {
                        mode: 'x',
                        color: '#FA5C0D'
                    }
                },
                height: 40,
                store: new Ext.iG.FlotJsonStore({
                    url: cfg.store.url,
                    baseParams: Ext.applyIf({
                        start: '',
                        end: ''
                    }, cfg.store.baseParams)
                })
			}));
		}
		cfg.items = items;
		Ext.applyIf(cfg, {
			tbar: new Ext.iG.Toolbar({
                store: cfg.store,
                activeFrame: cfg.activeFrame,
                listeners: {
                	scope: this,
                	beforeprint: function() {
                		this.preparePrint();
                	}
                }
            })
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
        if(this.overview) {
        	/*this.mon(this.flot, {
        		scope: this,
        		zoomin: function(flot, ranges) {
        			console.log(ranges);
        			this.overview.getFlot().setSelection(ranges, true);
        		},
        		zoomout: function(flot, ranges) {
                    if(ranges) {
                        this.overview.getFlot().setSelection(ranges, true);
                    } else {
                        this.overview.getFlot().clearSelection();
                    }
        		}
        	});*/
        	this.mon(this.overview.store, {
        		scope: this,
        		single: true,
        		load: function() {
	                this.overview.getFlot().setSelection({
	                    xaxis: {
	                        from: this.store.baseParams.start,
	                        to: this.store.baseParams.end
	                    }
	                }, true);
	                this.mon(this.flot.store, {
	                	scope: this,
	                	load: function(store) {
		                    this.overview.getFlot().setSelection({
		                        xaxis: {
		                            from: store.getStart()*1000,
		                            to: store.getEnd()*1000
		                        }
		                    }, true);
	                	}
	                });
        		}
        	});
        	this.mon(this.overview, {
        		scope: this,
        		plotselected: function(flot, ranges) {
        			if(this.overview.shint) {
        				this.overview.shint.hide();
        			}
        			if(ranges) {
        				this.store.load({
        				    params: {
        				    	start: Math.ceil(ranges.xaxis.from/1000),
        				    	end: Math.ceil(ranges.xaxis.to/1000)
        				    }
        				});
        			}
        			// Do NOT zoom in.
        			return false;
        		},
        		contextmenu: function(flot, event) {
        			event.stopEvent();
        			if(this.overview.getFlot().getSelection()) {
	        			this.store.load();
	        			this.overview.getFlot().clearSelection();
        			}
        			// Do NOT zoom out.
        			return false;
        		},
        		plotselecting: function(flot, ranges, pos) {
        			if(ranges) {
        				this.flot.store.stopRefresh();
        				var clipped = new Array();
        				Ext.each(this.overview.flot.getData(),
        				         function(series) {
        				    var data = series.data.filter(function(xy) {
    				        	if(xy[0] >= ranges.xaxis.from &&
    				        	   xy[0] <= ranges.xaxis.to) {
    				        	    return true;
                                }
                                return false;
                            });
                            if(data.length) {
	        				    clipped.push(Ext.applyIf({
	        				    	data: data
	        				    }, series));
                            }
        				});
		                var flotOptions = this.flot.flotOptions;
		                Ext.apply(flotOptions.xaxis, {
		                	min: ranges.xaxis.from,
		                	max: ranges.xaxis.to
		                });
		                this.flot.flot = $.plot($('#' + this.flot.id),
		                                        clipped, flotOptions);
        			}
        		}
        	});
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
			tag: 'div',
			cls: 'flot-print-container',
			children: [{
				tag: 'div',
				cls: 'flot-print-title',
				html: this.title,
			}, {
				tag: 'div',
				id: id,
				cls: 'flot-print-graph',
				style: {
					width: '670px',
					height: '170px'
				}
			}]
		}, true);
		this.flot.plot({id: id});
		Ext.EventManager.addListener(window, 'focus', function() {
			Ext.destroy.defer(1000, this, [el]);
		}, this, {single: true});  	
    }
});
Ext.reg('flotpanel', Ext.iG.FlotPanel);