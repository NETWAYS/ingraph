Ext.ux.Flot = Ext.extend(Ext.BoxComponent, {
    
    refreshBuffer : 200,
    
    tooltipEvent : 'plothover',
    
    loadMask : false,
    
    absolute : true,
    
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
            mode : 'time'
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
            flotOptions : Ext.apply({}, Ext.ux.util.clone(this.defaultFlotOptions)),
            id : Ext.id(null, 'flot-container')
        });
        
        cfg.selection = new Array();
        
        Ext.ux.Flot.superclass.constructor.call(this, cfg);
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
                this.flotOptions = iG.merge(this.store.reader.jsonData.options, this.flotOptions);
            }
            
            var series = new Array(),
                ranges = this.selection.last();
                
                
            if(this.absolute) {
                Ext.apply(this.flotOptions.xaxis, {
                    min : this.store.reader.jsonData.start ? this.store.reader.jsonData.start*1000 : null,
                    max : this.store.reader.jsonData.end*1000
                });
            }

            this.store.each(function(record) {
                if(!record.get('disabled')) {
                    var data = Ext.apply({}, record.data);
                    
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
                    
                    if(data.data.length) {
                        data.lines = iG.merge(this.flotOptions.lines, data.lines);
                        series.push(data);
                    }
                }
            }, this);
            
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
    
    showTooltip : function(event, pos, item) {
        if(!this.tooltip) {
            this.tooltip = new Ext.ToolTip({
                renderTo : Ext.getBody()
            });
        }
        
        this.tooltip.update(Ext.ux.Flot.tooltipTemplate.apply({
            label : item.series.label,
            x : item.series.xaxis.tickFormatter.call(item.series.xaxis, item.datapoint[0], item.series.xaxis),
            y : item.datapoint[1].toFixed(2),
            unit : item.series.unit
        }));
        
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