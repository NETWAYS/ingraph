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
    flotOptions: {},
    zooms: [],
    commentCtxEnabled: false,
    
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
        this.flotOptions = iG.merge(true, {}, this.defaultFlotOptions,
                                    this.flotOptions);
        this.flotOptions.xaxis.tickFormatter = this.xTickFormatter;
        if(Ext.isObject(this.template)) {
            if(Ext.isObject(this.template.flot)) {
                iG.merge(true, this.flotOptions, this.template.flot);
            }
            if(this.template.generic !== undefined &&
               Ext.isNumber(this.template.generic.refreshInterval)) {
                this.store.startRefresh(this.template.generic.refreshInterval);
            }
        }
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
        this.on({
            scope: this,
            beforeplot: function() {
                this.applyTemplate();
            }
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
            var i = item.dataIndex*3;
            if(series.datapoints.points[i] !== undefined &&
               series.datapoints.points[i] !== x) {
                // Or find the x index
                i = series.datapoints.points.map(function(v, i) {
                    if(i % 3 === 0) {
                        return v;
                    }
                }).bsearch(x);
                if(i == -1) {
                    // Skip series as last resort.
                    return;
                }
                i *= 3;
            }
            var nx = series.datapoints.points[i],
                ny = series.datapoints.points[i+1];
            t['x' + series.xaxis.n] = nx;
            t['y' + series.yaxis.n] = ny;
            var item2coords = this.flot.p2c(t);
            if(Math.pow(Math.abs(itemcoords.left - item2coords.left), 2) +
               Math.pow(Math.abs(itemcoords.top - item2coords.top), 2) <=
               Math.pow(dist, 2)) {
                html += Ext.iG.Flot.tooltipTemplate.apply({
                    label: series.label,
                    x: series.xaxis.tickFormatter(nx, series.xaxis),
                    y: series.yaxis.tickFormatter(ny, series.yaxis)
                });
            }
        }, this);
        
        this.tooltip.update(html);
        this.tooltip.showAt([pos.pageX + 10, pos.pageY + 10]);
        var bsize = Ext.getBody().getViewSize(),
            tsize = this.tooltip.getSize(),
            o = null;
        xy = this.tooltip.getPosition();
        x = xy[0];
        y = xy[1];

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
            if((ranges = this.zooms.last())) {
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
    
    enableCommentCtx: function() {
        this.commentCtxEnabled = true;
        this.el.setStyle('cursor', 'pointer');
    },
    
    disableCommentCtx: function() {
        this.commentCtxEnabled = false;
        this.el.setStyle('cursor', 'default');
    },
    
    onPlotClick: function(item, pos) {
        if(this.fireEvent('plotclick', this, item) !== false) {
            if(this.commentCtxEnabled === true) {
                var hosts = [], services = [];
                this.store.getHostsAndServices(hosts, services);
                var cfg = {
                    minDate: new Date(this.store.getStart()*1000),
                    maxDate: new Date(this.store.getEnd()*1000),
                    hosts: hosts,
                    services: services,
                    listeners: {
                        scope: this,
                        __igcomment__: function() {
                            this.store.load();
                        }
                    }
                };
                if(item) {
                    Ext.apply(cfg, {
                        comment_host: item.series.host,
                        comment_service: item.series.service,
                        comment_timestamp: item.datapoint[0]
                    });
                } else {
                    Ext.apply(cfg, {
                        comment_host: hosts[0],
                        comment_service: services[0],
                        comment_timestamp: pos.x
                    });
                }
                new Ext.iG.CommentForm(cfg).windowed().show();
                this.disableCommentCtx();
            }
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
                    update: this.onUpdate,
                    beforeautorefresh: this.onBeforeautorefresh
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
    
    xTickFormatter: function(v, axis) {
        if(axis.ticks.length === 0) {
            this.lastDate = null;
        }
        var d = new Date(v);
        d = new Date(v - d.getTimezoneOffset()*60*1000);
        var fmt = '%b %d %y %h:%M';
        if(this.lastDate !== null) {
            if(this.lastDate.getFullYear() === d.getFullYear() &&
               this.lastDate.getMonth() === d.getMonth() &&
               this.lastDate.getDate() === d.getDate()) {
                fmt = '%h:%M';
            }
        }
        this.lastDate = d;
        return $.plot.formatDate(d, fmt, this.monthNames);
    },
    
    yTickFormatter: function(v, axis) {
        if(axis.ticks.length === 0) {
            this.rawTicks = axis.tickGenerator(axis);
        }
        if(this.units === undefined) {
            this.units = {
                byte: Ext.iG.Util.formatByte,
                time: Ext.iG.Util.formatTime,
                percent: Ext.iG.Util.formatPercent,
                c: Ext.iG.Util.formatCounter
            };
        }
        if(v === this.rawTicks.last()  && this.label !== undefined) {
            return this.label;
        }
        if(v > 0 && this.units[this.unit] !== undefined) {
            var callback = this.units[this.unit],
                format = callback.call(this, v);
            return format.value.toFixed(axis.tickDecimals) + ' ' + format.unit;
        }
        return v.toFixed(axis.tickDecimals);
    },
    
    buildSeries: function() {
        this.store.each(function(rec) {
            if(rec.get('enabled')) {
                Ext.each(rec.data.data, function(xy) {
                    xy[0] *= 1000;
                });
            }
        }, this);
    },
    
    applyTemplate: function() {
        if(Ext.isArray(this.template.series)) {
            Ext.each(this.template.series, function(series) {
                var id = series.host + series.service + series.plot +
                         series.type,
                rec = this.store.getById(id);
                if(series.convert !== undefined) {
                    try {
                        var convert = Ext.decode(series.convert, true);
                        if(Ext.isFunction(convert)) {
                            var scope = {};
                            if(this.snapshot === undefined) {
                                this.snapshot = this.store.data.getRange().map(
                                    function(rec) {
                                        return {
                                            host: rec.data.host,
                                            service: rec.data.service,
                                            plot: rec.data.plot,
                                            type: rec.data.type,
                                            data: rec.data.data
                                        };
                                    });
                            }
                            Ext.each(rec.data.data, function(xy) {
                                y = convert.call(scope, xy[1], xy[0],
                                                this.snapshot);
                                if(y !== xy[1] && (Ext.isNumber(y) ||
                                   y === null)) {
                                    xy[1] = y;
                                }
                            }, this);
                        }
                    } catch(e) {
                        console.log(e);
                    }
                }
                Ext.apply(rec.data, series);
            }, this);
            if(this.snapshot !== undefined) {
                delete this.snapshot;
            }
        }
        if(this.autoYAxes) {
            if(this.flotOptions.yaxes === undefined) {
               this.flotOptions.yaxes = [];
            } else {
                Ext.each(this.flotOptions.yaxes, function(yaxis) {
                    yaxis.tickFormatter = this.yTickFormatter;
                }, this);
                this.autoYAxes = false;
            }
            var min = 0;
            this.store.each(function(rec) {
                if(rec.get('enabled') !== true) {
                    return;
                }
                // TODO(el): Process on server-side?
                var yvalues = [];
                Ext.each(rec.data.data, function(xy) {
                    if((y = xy[1]) !== null) {
                        yvalues.push(y);
                    }
                });
                var seriesmin = yvalues.length ?
                                Math.min.apply(Math, yvalues) :
                                null;
                if(seriesmin !== null && seriesmin < min) {
                    min = seriesmin;
                }
                var unit = rec.get('unit');
                Ext.each(this.flotOptions.yaxes, function(yaxis, i) {
                    if(yaxis.unit === rec.get('unit')) {
                        rec.set('yaxis', i+1); // Flot's axis index starts
                                               // with 1.
                    }
                });
                var i = this.flotOptions.yaxes.length;
                // Setting yaxis on series via template plus if there's no
                // yaxes configuration present breaks this code.
                if(rec.get('yaxis') === undefined) {
                    this.flotOptions.yaxes.push({
                        position: i % 2 === 0 ? 'left' : 'right',
                        unit: unit,
                        label: rec.get('label'),
                        tickFormatter: this.yTickFormatter,
                        min: unit === 'percent' ? 0 : min,
                        max: unit === 'percent' ? 100 : null
                    });
                    rec.set('yaxis', i+1);
                }
            }, this);
        }
    },
    
    annotate: function() {
        var yaxis = this.flot.getYAxes()[0],
            y = Math.floor((yaxis.min + yaxis.max)*0.75);
        Ext.each(this.store.getComments(), function(comment) {
            var o = this.flot.pointOffset({
                x: comment.timestamp*1000,
                y: y
            });
            var el = this.el.createChild({
                tag: 'img',
                src: 'images/icons/balloon-ellipsis.png',
                style: {
                    position: 'absolute',
                    left: o.left + 'px',
                    top: o.top + 'px',
                    cursor: 'pointer'
                }
            });
            el.on({
                scope: this,
                click: function(e) {
                    var hosts = [], services = [];
                    this.store.getHostsAndServices(hosts, services);
                    var cfg = {
                        minDate: new Date(this.store.getStart()*1000),
                        maxDate: new Date(this.store.getEnd()*1000),
                        hosts: hosts,
                        services : services,
                        comment_id: comment.id,
                        comment_host: comment.host,
                        comment_service: comment.service,
                        comment_timestamp: comment.timestamp*1000,
                        comment_text: comment.text,
                        listeners: {
                            scope: this,
                            __igcomment__: function() {
                                this.store.load();
                            }
                        }
                    };
                    new Ext.iG.CommentForm(cfg).windowed().show();
                },
                mouseover: function(e) {
                    new Ext.ToolTip({
                        title: comment.host + ' - ' + comment.service + ' (' +
                               Ext.util.Format.date(
                                   new Date(comment.timestamp*1000),
                                   'Y-m-d H:i:s') + '):',
                        renderTo: Ext.getBody(),
                        anchor: 'left',
                        target: e.target,
                        html: comment.author + ': ' + comment.text,
                        listeners: {
                            hide: function(self) {
                                self.destroy();
                            }
                        }
                    }).show();
                }
            });
        }, this);
    },
    
    plot: function(id, series) {
        if(this.fireEvent('beforeplot', this) !== false) {
            if(series === undefined) {
                series = [];
                this.store.each(function(rec) {
                    if(rec.get('enabled') === true) {
                        series.push(rec.data);
                    }
                });
            }
            if(id === undefined) {
                id = this.id;
            }
            this.flot = $.plot($('#' + id), series, this.flotOptions);
            if(this.loadMask) {
               this.el.setStyle('position', 'relative');
            }
            this.annotate();
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
        '<div>{x} : {y}</div>',
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
