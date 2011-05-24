Ext.ux.Flot = Ext.extend(Ext.BoxComponent, {
    
    refreshBuffer : 200,
    
    tooltipEvent : 'plothover',
    
    loadMask : false,
    
    absolute : true,
    
    autoAddYAxes : true,
    
    markingsCritColor : 'rgba(255,0,0,0.4)',
    
    markingsWarnColor : 'rgba(255,255,0,0.4)',

    units : {
    	time : {
    		factor : 1000,
    		expected : 's',
    		units : ['ms', 'ns']
    	},
    	'byte' : {
    		factor : 0.001,
    		expected : 'B',
    		units : ['KB', 'MB', 'GB', 'TB']
    	},
    	percent : {
    		expected : '%'
    	},
    	raw : {
    		expected : 'raw'
    	},
    	counter : {
    		expected : 'counter'
    	}
    },
      
    defaultFlotOptions : {
        legend : {
            show : true,
            backgroundOpacity : 0.4
        },
        grid : {
            show : true,
            borderWidth : 1,
            borderColor : 'rgba(255, 255, 255, 0)',
            hoverable : true,
            
            canvasText : {
                show : false
            }
        },
        xaxis : {
            show : true,
            mode : 'time',
            tickFormatter : function(time) {
            	return (new Date(time)).format('M d, Y H:i:s');
            }
        },
        series : {
            lines : {
                show : true,
                lineWidth : 1
            },
            points : {
                show : false
            }
        },
        selection : {
            mode : 'x'
        }
    },
    
    constructor : function(cfg) {
        cfg = cfg || {};
        
        Ext.applyIf(cfg, {
            flotOptions : {},
            id : Ext.id(null, 'flot-container')
        });
        
        cfg.selection = new Array();
        cfg.yaxes = new Array();
        
        Ext.ux.Flot.superclass.constructor.call(this, cfg);
        
        this.flotOptions = iG.merge(true, {}, this.defaultFlotOptions, this.flotOptions);
        this.genericOptions = {};
    },
    
    initComponent : function() {
        Ext.ux.Flot.superclass.initComponent.call(this);
        
        this.store = Ext.StoreMgr.lookup(this.store);
        
        this.addEvents(
            'beforerefresh',
            'refresh',
            'plothover',
            'plotselecting',
            'plotselected',
            'contextmenu',
            'selectionchange'
        );
    },
    
    onRender : function(ct, position) {  
        Ext.ux.Flot.superclass.onRender.call(this, ct, position);
        
        this.width = (this.width || ct.getWidth()) - 20;
        this.height = this.height || ct.getHeight();
        Ext.fly(this.id).setSize(this.width, this.height);
        
        this.bindStore(this.store, true);
        
        this.refresh.defer(10, this);
    },
    
    afterRender : function() {
        Ext.ux.Flot.superclass.afterRender.call(this);
        
        this.el.on({
            contextmenu : this.onContextMenu,
            scope : this
        });
        
        $('#' + this.id).bind('plothover', function(event, pos, item) {
            flot = Ext.getCmp(event.target.id);
            flot.onPlotHover(event, pos, item);
        });
        $('#' + this.id).bind('plotselecting', function(event, ranges, pos) {
            flot = Ext.getCmp(event.target.id);
            flot.onPlotSelecting(event, pos, ranges);           
        });
        $('#' + this.id).bind('plotunselected', function() {
        });
        $('#' + this.id).bind('plotselected', function(event, range) {
            flot = Ext.getCmp(event.target.id);
            flot.onPlotSelected(event, range);
        });
        
        if(this.tooltipEvent) {
            this.on(this.tooltipEvent, function(flot, event, pos, item) {
                if(item) {
                    flot.showTooltip(event, pos, item, false); 
                } else {
                    if(this.tooltip) {
                        this.tooltip.hide();
                    }
                }
            }, this);
        }
        
        
        this.on({
            'plotselected' : {
                fn : function(flot, event, ranges) {
                    flot.select(event, ranges);
                }
            },
            'contextmenu' : {
                fn : function(flot, event) {
                    flot.unselect(event);
                }
            },
            'beforerefresh' : {
                fn : function() {
                
                }
            },
            'refresh' : {
                fn : function() {
                    
                }
            },
            scope : this
        });
        
        if(this.loadMask) {
            this.loadMask = new Ext.LoadMask(this.el,
                    Ext.apply({
                        store : this.store,
                        removeMask : true
                    }, this.loadMask)
            );
        }
    },
    
    bindStore : function(store, initial) {
        if(!initial && this.store) {
            if(store !== this.store && this.store.autoDestroy) {
                this.store.destroy();
            } else {
                this.store.un('datachanged', this.refresh, this);
                this.store.un('add', this.delayRefresh, this);
                this.store.un('remove', this.delayRefresh, this);
                this.store.un('update', this.delayRefresh, this);
                this.store.un('clear', this.refresh, this);
            }
        }
        
        if(store) {
            store = Ext.StoreMgr.lookup(store);
            
            store.on({
                scope : this,
                datachanged : this.refresh,
                add : this.delayRefresh,
                remove : this.delayRefresh,
                update : this.delayRefresh,
                clear : this.refresh
            });
        }
        
        this.store = store;
        if(store && !initial) {
            this.refresh();
        }

    },
    
    refresh : function() {
        if(this.fireEvent('beforerefresh', this) !== false) {
            if(typeof this.store.reader.jsonData === 'undefined') {
                return;
            }
            if(typeof this.store.reader.jsonData.options !== 'undefined') {
            	if(this.store.reader.jsonData.options.flot) {
            		this.flotOptions = iG.merge(true, {}, this.flotOptions, this.store.reader.jsonData.options.flot);
            	}
            	if(this.store.reader.jsonData.options.generic) {
            		this.genericOptions = this.store.reader.jsonData.options.generic;
            		if(this.genericOptions.refreshInterval) {
            			this.store.setRefresh(this.genericOptions.refreshInterval, true);
            		}
            	}
            }
            
            var series = new Array(),
                ranges = this.selection.last(),
                markings = new Array();
                
                
            if(this.absolute) {
                Ext.apply(this.flotOptions.xaxis, {
                    min : this.store.reader.jsonData.start ? this.store.reader.jsonData.start*1000 : null,
                    max : this.store.reader.jsonData.end*1000
                });
            }

            this.store.each(function(record) {
                if(!record.get('disabled')) {
                    var data = Ext.apply({}, record.data);
                    
                    if(this.autoAddYAxes) {
                        this.axify(data);
                    }
                    
                    /*
                    if(ranges) {
                        data.data = data.data.filter(function(xy) {
                            if(xy[0] > = ranges.xaxis.from
                                    && xy[0] < = ranges.xaxis.to
                                    && xy[1] > = ranges.yaxis.from
                                    && xy[1] < = ranges.yaxis.to) {
                                return true;
                            }
                            return false;
                        }); 
                    }
                    */
                    

                    /**
                     * @TODO: Refactor.
                     */
                    if(data.key.substr(-4) == '-avg') {
                    	var prefix = data.key.substr(0, data.key.length - 4),
                    	    store = this.store,
                    		getData = function(id) {
                    			var series = store.getById('{0}-{1}'.format(prefix, id));
                    			return series ? series.get('data') : false;
                    		},
                    		thresholds = {},
                    	    c = getData('crit_type'),
                    	    w = getData('warn_type');

                    	if(c || w) {
                    		thresholds['crit_type'] = c;
                    		thresholds['warn_type'] = w;
                    		Ext.iterate(['crit_lower', 'crit_upper', 'warn_lower', 'warn_upper'], function(threshold) {
                    			thresholds[threshold] = getData(threshold);
                    		});
                    		var marking = {};

	                    	Ext.each(data.data, function(xy, i) {
	                    		var x = xy[0],
	                    			y = parseFloat(xy[1]),
	                    			ctype = iG.getY(x, thresholds['crit_type']),
	                    			clower = iG.getY(x, thresholds['crit_lower'], parseFloat),
	                    			cupper = iG.getY(x, thresholds['crit_upper'], parseFloat),
	                    			wtype = iG.getY(x, thresholds['warn_type']),
	                    			wlower = iG.getY(x, thresholds['warn_lower'], parseFloat),
	                    			wupper = iG.getY(x, thresholds['warn_upper'], parseFloat),
	                    			isViolation = function(type, lower, upper) {
	                    				var violation;
	                    				
	                    				if(lower == 0 && upper == 0) {
	                    					return false;
	                    				}
	                    				
	                    				switch(type) {
		                    				case 'inside':
		                    					violation = y > lower && y < upper ? true : false;
		                    					break;
		                    				case 'outside':
		                    					violation = y < lower || y > upper ? true : false;
		                    					break;
		                    				default:
		                    					violation = false;
	                    				}
	                    				
	                    				return violation;
	                    			};
	                    			
	                    		if(!ctype && !wtype) {
	                    			return;
	                    		}
	                    		
	                    		if(isViolation(ctype, clower, cupper)) {
	                    			if(marking.from && marking.type == 'w') {
	                    				markings.push({
	                    					color : this.markingsWarnColor,
	                    					xaxis : {
		                    					from : marking.from,
		                    					to : x
	                    					}
	                    				});
	                    				marking = {};
	                    			}
	                    			
	                    			if(!marking.from) {
		                    			marking = {
		                    			    from : x,
		                    			    type : 'c'
		                    			};
	                    			}
	                    		} else if(marking.from && marking.type == 'c') {
                    				markings.push({
                    					color : this.markingsCritColor,
                    					xaxis : {
	                    					from : marking.from,
	                    					to : x
                    					}
                    				});
                    				marking = {};	                    			
	                    		} 
	                    		
	                    		if(isViolation(wtype, wlower, wupper) && !marking.from) {
	                    			marking = {
	                    			    from : x,
	                    			    type : 'w'
	                    			};
	                    		} else if(marking.from && marking.type == 'w') {
                    				markings.push({
                    					color : this.markingsWarnColor,
                    					xaxis : {
	                    					from : marking.from,
	                    					to : x
                    					}
                    				});
                    				marking = {};                    			
	                    		}

	                    		if(i == data.data.length-1) {
	                    			if(marking.from) {
	                    				if(marking.type == 'c') {
	                        				markings.push({
	                        					color : this.markingsCritColor,
				            					xaxis : {
				                					from : marking.from,
				                					to : x
				            					}
	                        				});
	                    				} else {
	                        				markings.push({
	                        					color : this.markingsWarnColor,
				            					xaxis : {
				                					from : marking.from,
				                					to : x
				            					}
	                        				});
	                    				}
	                    			}
	                    		}
	                    		
	                    	}, this);
                    	}
                    	
                    }
                    
                    if(data.data.length) {
                        data.lines = iG.merge(true, {}, this.flotOptions.lines, data.lines);
                        series.push(data);
                    }
                }
            }, this);
            
            if(this.autoAddYAxes) {
            	delete this.flotOptions.yaxis;
            	this.flotOptions.yaxes = new Array();
            	
            	var self = this;
            	
            	Ext.each(this.yaxes, function(axe, i) {
            		this.flotOptions.yaxes.push({
            			position : i % 2 == 0 ? 'left' : 'right',
            			tickFormatter : function(v, axis) {
            				if(!this.tmpTicks) {
            					this.tmpTicks = axis.tickGenerator(axis);
            				}
            				
            				if(!this.unit) {
            					var u = self.units[axe],
            					    l = u.expected;
            					    
            					this.unit = {
            						label : l,
            						factor : 1
            					};
            					
            					if(u.factor) {
            						var m = this.tmpTicks.mean(),
            						    a = u.units.length,
            						    i = 0;
            						
            						if(m >= 1) {
	            						while((m*=u.factor) > 1 && i < a) {
	            							l = u.units[i++];
	            						}
            						} else {
                                        while((m*=u.factor) < 100 && i < a) {
                                            l = u.units[i++];
                                        }            							
            						}
            						
            						this.unit = {
            							factor : Math.pow(u.factor, i),
            							label : l
            						};
            					}
            					
            					axis.unit = this.unit;
           				    }
            				
            				if(v == this.tmpTicks.last()) {
            					delete this.tmpTicks;
            					
            					qtip = new Array();
            					Ext.each(series, function(s) {
                                    if(s.yaxis == axis.n) {
                                        qtip.push('{0} &#040;{1}&#041;'.format(s.label, this.unit.label));
                                    }
                                }, this);
                                return '<div ext:qtip="{0}">{1}</div>'.format(qtip.join('<br />'), qtip[0]);
            				}
            				
            				return (v * this.unit.factor).toFixed(axis.tickDecimals);
            			}
            		});
            	}, this);
            }
            
            series.sort(function(a, b) {
            	return a.data.map(function(v) {
            		return parseFloat(v[1]);
            	}).mean() - b.data.map(function(v) {
                    return parseFloat(v[1]);
                }).mean();
            });
            
            this.flotOptions.grid.markings = markings;

            this.plot(series);

            this.fireEvent('refresh', this);
        }
    },
    
    delayRefresh : function() {
        if(!this.refreshTask) {
            this.refreshTask = new Ext.util.DelayedTask(this.refresh, this);
        }
        this.refreshTask.delay(this.refreshBuffer);
    },
    
    plot : function(series) {
        this.flot = $.plot($('#' + this.id), series, this.flotOptions);
        if(this.loadMask) {
           this.el.setStyle('position', 'relative');
        }
    },
    
    draw : function() {
        if(this.flot) {
            return this.flot.draw();
        }
        return null;
    },
    
    axify : function(series) {
    	var iof = this.yaxes.indexOf(series.unit);
    	if(-1 === iof) {
    		iof = this.yaxes.push(series.unit);
    	} else {
    		++iof;
    	}
    	series.yaxis = iof;
    },
    
    showTooltip : function(event, pos, item) {
        if(!this.tooltip) {
            this.tooltip = new Ext.ToolTip({
                renderTo : Ext.getBody()
            });
        }
        
        var xy = item.series.data[item.dataIndex],
        	x = xy[0],
        	y = xy[1],
        	html = Ext.ux.Flot.tooltipTemplate.apply({
                label : item.series.label,
                x : item.series.xaxis.tickFormatter.call(item.series.xaxis, item.datapoint[0], item.series.xaxis),
                y : item.series.yaxis.tickFormatter.call(item.series.yaxis, item.datapoint[1], item.series.yaxis),
                unit : item.series.yaxis.unit.label
            }),
            dist = 10,
            ac = {};
        
		ac['x{0}'.format(item.series.xaxis.n)] = x;
		ac['y{0}'.format(item.series.yaxis.n)] = y;
		var icc = this.flot.p2c(ac);
        
        Ext.each(this.flot.getData(), function(series) {        	
        	if(series.index == item.seriesIndex) {
        		return;
        	}
        	
        	var i = series.data.map(function(xy) {
	    		return xy[0];
	    	}).bsearch(x);
        	
        	if(i != -1) {
        		var point = series.data[i];
        		var ac = {};
        		ac['x{0}'.format(series.xaxis.n)] = point[0];
        		ac['y{0}'.format(series.yaxis.n)] = point[1];
        		
        		pcc = this.flot.p2c(ac);
        		
        		if(Math.pow(Math.abs(pcc.left - icc.left), 2) + Math.pow(Math.abs(pcc.top - icc.top), 2) <= Math.pow(dist, 2)) {
                	html += Ext.ux.Flot.tooltipTemplate.apply({
                        label : series.label,
                        x : series.xaxis.tickFormatter.call(item.series.xaxis, point[0], series.xaxis),
                        y : series.yaxis.tickFormatter.call(item.series.yaxis, point[1], series.yaxis),
                        unit : series.yaxis.unit.label
                    });      			
        		}
        	}
        }, this);
        
        this.tooltip.update(html);
        
        this.tooltip.showAt([pos.pageX + 10, pos.pageY + 10]);
        
        var bsize = Ext.getBody().getViewSize(),
            tsize = this.tooltip.getSize(),
            xy = this.tooltip.getPosition(),
            x = xy[0],
            y = xy[1],
            o = null;

        if((o = bsize.width - tsize.width - x) < 0) {
            x += o;
        }
        if((o = bsize.height - tsize.height - y) < 0) {
            y += o;
        }
        this.tooltip.setPagePosition([x,y]);
    },
    
    showSelectionHint : function(event, pos, ranges) {
        if(!this.shint) {
            this.shint = new Ext.ToolTip({
                renderTo : Ext.getBody()
            });
        }
        
        this.shint.update(Ext.ux.Flot.sHintTpl.apply({
            from : this.flot.getAxes().xaxis.tickFormatter.call(this.flot.getAxes().xaxis, ranges.xaxis.from, this.flot.getAxes().xaxis),
            to : this.flot.getAxes().xaxis.tickFormatter.call(this.flot.getAxes().xaxis, ranges.xaxis.to, this.flot.getAxes().xaxis)
        }));
        
        this.shint.showAt([pos.pageX + 10, pos.pageY + 10]);
    },
    
    select : function(event, ranges) {
        if(!ranges.xaxis) {
            return;
        }
        
        this.selection.push(ranges);
        
        this.store.load({
            params : {
                start : Math.ceil(ranges.xaxis.from/1000),
                end : Math.ceil(ranges.xaxis.to/1000)
            }
        });
    },
    
    unselect : function(event) {
        event.stopEvent();
        
        if(this.selection.pop()) {
            if(ranges = this.selection.last()) {
                this.store.load({
                    params : {
                        start : Math.ceil(ranges.xaxis.from/1000),
                        end : Math.ceil(ranges.xaxis.to/1000)
                    }
                });
            } else {
                this.store.load();
            }
        }
    },
    
    resetTemplate : function() {
        if(typeof this.store.reader.jsonData.options !== 'undefined') {
        	delete this.store.reader.jsonData.options;
        }
        this.flotOptions = Ext.apply({}, Ext.ux.util.clone(this.defaultFlotOptions));
    },
    
    getStore : function() {
        return this.store;
    },
    
    getFlot : function() {
        return this.flot;
    },
    
    onContextMenu : function(event) {
        this.fireEvent('contextmenu', this, event);
    },
    
    onPlotHover : function(event, pos, item)  {
        this.fireEvent('plothover', this, event, pos, item);
    },
    
    onPlotSelecting : function(event, pos, ranges)  {
        this.fireEvent('plotselecting', this, event, pos, ranges);
    },
    
    onPlotSelected : function(event, ranges) {
        this.fireEvent('plotselected', this, event, ranges);
    },
    
    onSelectionChange : function(event, ranges) {
        this.fireEvent('selectionchange', this, event, ranges);
    },
    
    onDestroy : function() {
        if (this.refreshTask && this.refreshTask.cancel) {
            this.refreshTask.cancel();
        }
        
        Ext.ux.Flot.superclass.onDestroy.call(this);
        
        this.bindStore(null);
        
        if(this.tooltip) {
            this.tooltip.destroy();
        }
    }

});

Ext.reg('flot', Ext.ux.Flot);

Ext.ux.Flot.tooltipTemplate = new Ext.Template(
        '<div class = "iG-tooltip">',
        '<h3>{label}</h3>',
        '<div>{x} : {y} {unit}</div>',
        '</div>', {
        compiled : true,
        disableFormats : true
});

Ext.ux.Flot.sHintTpl = new Ext.Template(
        '<div class = "iG-tooltip">',
        '<div><p><b>{0} : </b> {from}</p></div>'.format(_('Start')),
        '<div><p><b>{0} : </b> {to}</p></div>'.format(_('End')),
        '</div>', {
        compiled : true,
        disableFormats : true
});