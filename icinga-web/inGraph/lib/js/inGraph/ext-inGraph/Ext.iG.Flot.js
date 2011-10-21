Ext.ns('Ext.iG');
Ext.iG.Flot = Ext.extend(Ext.BoxComponent, {
    refreshBuffer: 200,
    loadMask: false,
    absolute: true,
    cls: 'flot',
    autoYAxes: true,

    defaultFlotOptions: {
        legend: {
            show: true,
            backgroundOpacity: 0.4
        },
        grid: {
            show: true,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0)',
            hoverable: true,
            clickable: true,
            canvasText: {
                show: false
            }
        },
        xaxis: {
            show: true,
            mode: 'time'
        },
        series: {
            lines: {
                show: true,
                lineWidth: 1
            },
            points: {
                show: false
            }
        },
        selection: {
            mode: 'x'
        }
    },
    
    constructor: function(cfg) {
        cfg = cfg || {};
        Ext.applyIf(cfg, {
            flotOptions: {},
            id: Ext.id(null, 'flot-container'),
            zooms: new Array()
        });
        Ext.iG.Flot.superclass.constructor.call(this, cfg);
        this.flotOptions = iG.merge(true, {}, this.defaultFlotOptions,
                                    this.flotOptions);
    
    },
    
    initComponent: function() {
        Ext.iG.Flot.superclass.initComponent.call(this);
        this.addEvents(
            'beforeplot',
            'plot',
            'plotclick',
            'plothover',
            'plotselecting',
            'plotselected',
            'selectionchange',
            'zoomin',
            'zoomout',
            'contextmenu'
        );
        this.bindStore(this.store, true);
    },
    
    onRender: function() {
        Ext.iG.Flot.superclass.onRender.apply(this, arguments);
        this.initEvents();
    },
    
    initEvents: function() {
        if(this.loadMask) {
            this.loadMask = new Ext.LoadMask(this.el, Ext.apply({
                store: this.store,
                removeMask: true
            }, this.loadMask));
        }

        $('#' + this.id).bind('plothover', function(event, pos, item) {
            var self = Ext.getCmp(event.target.id);
            self.onPlotHover(item, pos);
        });
        $('#' + this.id).bind('plotselecting', function(event, ranges, pos) {
            var self = Ext.getCmp(event.target.id);
            self.onPlotSelecting(ranges, pos);
        });
        $('#' + this.id).bind('plotselected', function(event, ranges) {
            var self = Ext.getCmp(event.target.id);
            self.onPlotSelected(ranges);
        });
        $('#' + this.id).bind('plotclick', function(event, pos, item) {
            var self = Ext.getCmp(event.target.id);
            self.onPlotClick(item, pos);
        });
        this.mon(this.el, {
        	scope: this,
        	contextmenu: this.onContextMenu
        });
    },
    
    showTooltip: function(item, pos) {
        if(!this.tooltip) {
            this.tooltip = new Ext.ToolTip({
                renderTo: Ext.getBody()
            });
        }
        var xy = item.datapoint,
            x = xy[0],
            y = xy[1],
            html = Ext.iG.Flot.tooltipTemplate.apply({
                label: item.series.label,
                x: item.series.xaxis.tickFormatter(x, item.series.xaxis),
                y: item.series.yaxis.tickFormatter(y, item.series.yaxis),
                unit: item.series.unit
            }),
            dist = 10; // Allowed distance to show nearby items too.
        var t = {};
        t['x' + item.series.xaxis.n] = x;
        t['y' + item.series.yaxis.n] = y;
        var itemcoords = this.flot.p2c(t);
        
        // Find nearby points from other series.
        Ext.each(this.flot.getData(), function(series) {
            if(series.index == item.seriesIndex) {
            	// Exclude series of current item.
                return;
            }
            // Assume equal datapoints.
            var i = item.dataIndex;
            if(series.data[i] !== undefined && series.data[i][0] !== x) {
            	// Or find the x index
            	i = series.data.map(function(xy) {
	                return xy[0];
	            }).bsearch(x);
	            if(i == -1) {
	            	// Skip series as last resort.
	            	return;
	            }
            }
            var datapoint = series.data[i];
            t['x' + series.xaxis.n] = datapoint[0];
            t['y' + series.yaxis.n] = datapoint[1];
            var item2coords = this.flot.p2c(t);
            if(Math.pow(Math.abs(itemcoords.left - item2coords.left), 2) +
               Math.pow(Math.abs(itemcoords.top - item2coords.top), 2) <=
               Math.pow(dist, 2)) {
            	html += Ext.iG.Flot.tooltipTemplate.apply({
            		label: series.label,
            		x: series.xaxis.tickFormatter(datapoint[0], series.xaxis),
            		y: series.yaxis.tickFormatter(datapoint[1], series.yaxis),
            		unit: series.unit
            	});
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
    
    onPlotHover: function(item, pos) {
    	if(this.fireEvent('plothover', this, item, pos) !== false) {
	    	if(item) {
	    	   this.showTooltip(item, pos);
	    	} else {
	    		if(this.tooltip) {
	    			this.tooltip.hide();
	    		}
	    	}
    	}
    },
    
    showSelectionHint: function(ranges, pos) {
        if(!this.shint) {
            this.shint = new Ext.ToolTip({
                renderTo: Ext.getBody()
            });
        }
        var axes = this.flot.getAxes();
        this.shint.update(Ext.iG.Flot.sHintTpl.apply({
            from: axes.xaxis.tickFormatter(ranges.xaxis.from, axes.xaxis),
            to: axes.xaxis.tickFormatter(ranges.xaxis.to, axes.xaxis)
        }));
        this.shint.showAt([pos.pageX + 10, pos.pageY + 10]);
    },
    
    onPlotSelecting: function(ranges, pos) {
    	if(this.fireEvent('plotselecting', this, ranges, pos) !== false) {
	    	if(ranges) {
	            this.showSelectionHint(ranges, pos);
	    	}
    	}
    },
    
    zoomin: function(ranges) {
        this.zooms.push(ranges);
        this.store.load({
            params: {
                start: Math.ceil(ranges.xaxis.from/1000),
                end: Math.ceil(ranges.xaxis.to/1000)
            }
        });
        this.fireEvent('zoomin', this, ranges);
    },
    
    onPlotSelected: function(ranges) {
        if(this.fireEvent('plotselected', this, ranges) !== false) {
	    	if(ranges.xaxis) {
	            this.zoomin(ranges);
	    	}
	    	if(this.shint) {
	    		this.shint.hide();
	    	}
        }
    },
    
    zoomout: function() {  
        if(this.zooms.pop()) {
            if(ranges = this.zooms.last()) {
                this.store.load({
                    params: {
                        start: Math.ceil(ranges.xaxis.from/1000),
                        end: Math.ceil(ranges.xaxis.to/1000)
                    }
                });
            } else {
                this.store.load();
            }
            this.fireEvent('zoomout', this, ranges);
        }
    },
    
    onPlotClick: function(item) {
    	if(this.fireEvent('plotclick', this, item) !== false) {
    	   console.log(item);
    	}
    },
    
    onContextMenu: function(event) {
    	if(this.fireEvent('contextmenu', this, event) !== false) {
	    	// Prevent browser's context menu.
	    	event.stopEvent();
	    	this.zoomout();
    	}
    },
    
    onBeforeautorefresh: function() {
    	// Prevent autorefresh if hidden.
    	var ownerCt = this;
    	do {
    		if(ownerCt.hidden) {
    			return false;
    		}
    		ownerCt = ownerCt.ownerCt;
    	} while(ownerCt);
    },
    
    bindStore: function(store, initial) {
        if(!initial && this.store) {
            if(store !== this.store && this.store.autoDestroy) {
                this.store.destroy();
            } else {
            	this.store.un({
	                scope: this,
	                datachanged: this.onDatachanged,
	                update: this.onUpdate
            	});
            }
            if(!store) {
            	this.store = null;
            }
        }
        if(store) {
        	store.on({
                scope: this,
                datachanged: this.onDatachanged,
                update: this.onUpdate,
                beforeautorefresh: this.onBeforeautorefresh
        	});
        	this.store = store;
        }
    },
    
    yTickFormatter: function(v, axis) {
    	if(axis.rawTicks === undefined) {
    		axis.rawTicks = axis.tickGenerator(axis);
    	}
    	if(v === axis.rawTicks.last()) {
    		// If this did not auto add yaxes, unit and label may be undefined
    		// as its definition is left to the user.
    		return axis.options.label !== undefined ?
    		       (axis.options.unit !== undefined ?
    		        axis.options.label + ' (' + axis.options.unit + ')' :
    		        axis.options.label) :
    		       v.toFixed(axis.tickDecimals);
    	}
    	return v.toFixed(axis.tickDecimals);
    },
    
    buildSeries: function() {
    	var series = new Array();
    	this.store.each(function(rec) {
    		if(rec.get('enabled')) {
    			series.push(rec.data);
	            if(this.autoYAxes) {
	            	var unit = rec.get('unit');
	            	Ext.each(this.flotOptions.yaxes, function(yaxis, i) {
	            		if(yaxis.unit === rec.get('unit')) {
	            			rec.set('yaxis', i+1); // Flot's axis index starts
	            			                       // with 1.
	            		}
	            	});
	            	var i = this.flotOptions.yaxes.length;
	            	// Setting yaxis on series via template, plus if there's no
	            	// yaxes configuration present breaks this code.
	            	if(rec.get('yaxis') === undefined) {
	            		this.flotOptions.yaxes.push({
	            			position: i % 2 === 0 ? 'left' : 'right',
	            			unit: unit,
	            			label: rec.get('label'),
	            			tickFormatter: this.yTickFormatter
	            		});
	            		rec.set('yaxis', i+1);
	            	}
	            }
    		};
    	}, this);
    	this.series = series;
    },
    
    buildOptions: function() {
        var options = this.store.getOptions();
        iG.merge(true, this.flotOptions, options.flot);
        if(options.generic && options.generic.refreshInterval) {
            this.store.startRefresh(options.generic.refreshInterval);
        }
        if(this.autoYAxes) {
        	if(this.flotOptions.yaxes === undefined) {
        	   this.flotOptions.yaxes = new Array();
        	} else {
        		Ext.each(this.flotOptions.yaxes, function(yaxis) {
        			yaxis.tickFormatter = this.yTickFormatter;
        		}, this);
        		this.autoYAxes = false;
        	}
        }
    },
    
    plot: function(cfg) {
    	cfg = cfg || {};
        if(this.fireEvent('beforeplot', this) !== false) {
        	var series = cfg.series === undefined ? this.series : cfg.series,
        	    id = cfg.id === undefined ? this.id : cfg.id;
        	// Sort series by their mean from highest to lowest.
        	// This is nice for filled lines since series will not paint
        	// over each other.
            series.sort(function(a, b) {
            	return a.data.map(function(v) {
            		return parseFloat(v[1]);
            	}).mean() - b.data.map(function(v) {
                    return parseFloat(v[1]);
                }).mean();
            });
		    this.flot = $.plot($('#' + id), series, this.flotOptions);
		    if(this.loadMask) {
		       this.el.setStyle('position', 'relative');
		    }
            this.fireEvent('plot', this);
        }
    },
    
    delayPlot: function() {
        if(!this.refreshTask) {
            this.refreshTask = new Ext.util.DelayedTask(this.plot, this);
        }
        this.refreshTask.delay(this.refreshBuffer);
    },
    
    onDatachanged: function() {
        /*
         * @TODO(el): Do not merge options on every load since they change
         * unusually. Flag 'em dirty on change and make use of that.
         */
        this.buildOptions();
        this.buildSeries();
        if(this.absolute) {
            // Force full view of timerange even if there's no data.
            Ext.apply(this.flotOptions.xaxis, {
                min: this.store.getStart() ? this.store.getStart()*1000 :
                                             null,
                max: this.store.getEnd() ? this.store.getEnd()*1000 :
                                           new Date().getTime()
            });
        }
        this.plot();
    },
    
    onUpdate: function() {
        this.delayPlot();
    },
    
    getStore: function() {
        return this.store;
    },
    
    getFlot: function() {
        return this.flot;
    },
    
    onDestroy: function() {
        if (this.refreshTask && this.refreshTask.cancel) {
            this.refreshTask.cancel();
        }
        Ext.iG.Flot.superclass.onDestroy.call(this);
        this.bindStore(null);
        if(this.tooltip) {
            this.tooltip.destroy();
        }
        if(this.shint) {
        	this.shint.destroy();
        }
    }
});
Ext.reg('flot', Ext.iG.Flot);

Ext.iG.Flot.tooltipTemplate = new Ext.Template(
        '<div class = "iG-tooltip">',
        '<h3>{label}</h3>',
        '<div>{x} : {y} {unit}</div>',
        '</div>', {
        compiled: true,
        disableFormats: true
});
Ext.iG.Flot.sHintTpl = new Ext.Template(
        '<div class = "iG-tooltip">',
        String.format('<div><p><b>{0} : </b> {from}</p></div>', _('Start')),
        String.format('<div><p><b>{0} : </b> {to}</p></div>', _('End')),
        '</div>', {
        compiled: true,
        disableFormats: true
});