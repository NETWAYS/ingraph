Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Flot
 * @extends Ext.BoxComponent
 */
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
        this.flotOptions = iG.merge(true, {}, this.defaultFlotOptions,
                                    this.flotOptions);
        this.flotOptions.xaxis.tickFormatter = Ext.iG.Util.xTickFormatter;
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
        this.on({
            scope: this,
            single: true,
            beforeplot: this.applyTemplate
        });
    },
    
    showTooltip: function(item, pos) {
        if(!this.tooltip) {
            this.tooltip = new Ext.Tip({
                renderTo: Ext.getBody()
            });
        }
        var xy = item.datapoint,
            x = xy[0],
            y = xy[1],
            html = Ext.iG.Flot.tooltipTemplate.apply({
                label: item.series.label,
                x: Ext.iG.Util.xTickFormatter.call(
                       item.series.xaxis, x,item.series.xaxis, true),
                y: item.series.yaxis.tickFormatter(y, item.series.yaxis),
                unit: item.series.unit
            }),
            dist = 10; // Allowed distance to show nearby items too.
        var t = {};
        t['x' + item.series.xaxis.n] = x;
        t['y' + item.series.yaxis.n] = y;
        var itemcoords = this.$plot.p2c(t);
        
        // Find nearby points from other series.
        Ext.each(this.$plot.getData(), function(series) {
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
            var item2coords = this.$plot.p2c(t);
            if(Math.pow(Math.abs(itemcoords.left - item2coords.left), 2) +
               Math.pow(Math.abs(itemcoords.top - item2coords.top), 2) <=
               Math.pow(dist, 2)) {
                html += Ext.iG.Flot.tooltipTemplate.apply({
                    label: series.label,
                    x: Ext.iG.Util.xTickFormatter.call(
                           series.xaxis, nx, series.xaxis, true),
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
            this.shint = new Ext.Tip({
                renderTo: Ext.getBody()
            });
        }
        var axes = this.$plot.getAxes();
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
    
    onContextMenu: function(event) {
        if(this.fireEvent('contextmenu', this, event) !== false) {
            // Prevent browser's context menu.
            event.stopEvent();
            this.zoomout();
        }
    },
    
    onBeforeAutorefresh: function() {
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
                    datachanged: this.onDataChanged,
                    update: this.onUpdate,
                    beforeautorefresh: this.onBeforeAutorefresh
                });
            }
            if(!store) {
                this.store = null;
            }
        }
        if(store) {
            store.on({
                scope: this,
                datachanged: this.onDataChanged,
                update: this.onUpdate,
                beforeautorefresh: this.onBeforeAutorefresh
            });
            this.store = store;
        }
    },
    
    applyTemplate: function() {
        if(Ext.isObject(this.template.reader.jsonData.flot)) {
            iG.merge(true, this.flotOptions,
                     this.template.reader.jsonData.flot);
        }
        if(Ext.isObject(this.template.reader.jsonData.generic) &&
           Ext.isNumber(this.template.reader.jsonData.generic.refreshInterval)) {
            this.store.startRefresh(
                this.template.reader.jsonData.generic.refreshInterval);
        }
        this.template.each(function(series) {
            var rec = this.store.getById(series.id);
            if(!rec || !Ext.isObject(rec.data)) {
                return;
            }
            series.data = iG.merge(true, {}, this.flotOptions.series || {},
                                   series.data);
            var map = rec.fields.map;
            Ext.iterate(series.data, function(key, value) {
                if((m = map[key]) && m.isFlotOption && value !== undefined &&
                   value !== rec.get(m.mapping || m.name)) {
                    rec.set(m.mapping || m.name, value);
                }
            });
            if((c = series.get('convert'))) {
                rec.set('convert', Ext.decode(c, true));
            }
        }, this);
        if(this.autoYAxes) {
            // Kicks in if yaxes are not defined via template.
            if(this.flotOptions.yaxes === undefined) {
                this.flotOptions.yaxes = [];
                // All yaxes should share the same baseline.
                var ymin = 0;
                this.store.each(function(rec) {
                    if(rec.get('enabled') !== true) {
                        return;
                    }
                    var yvalues = [];
                    Ext.each(rec.get('data'), function(xy) {
                        if((y = xy[1]) !== null) {
                            yvalues.push(y);
                        }
                    });
                    var seriesmin = yvalues.length > 0 ?
                                    Math.min.apply(Math, yvalues) :
                                    null;
                    if(seriesmin !== null && seriesmin < ymin) {
                        ymin = seriesmin;
                    }
                    var unit = rec.get('unit'),
                        yaxis;
                    Ext.each(this.flotOptions.yaxes, function(axis, i) {
                        if(axis.unit === unit) {
                            yaxis = {
                                index: i,
                                config: axis
                            };
                        }
                    });
                    if(yaxis) {
                        yaxis.config.label.push(rec.get('label'));
                        // Flot's axis index starts with 1.
                        rec.set('yaxis', yaxis.index + 1);
                    } else {
                        var i = this.flotOptions.yaxes.length;
                        this.flotOptions.yaxes.push({
                            position: i % 2 === 0 ? 'left' : 'right',
                            unit: unit,
                            label: [rec.get('label')],
                            min: unit === 'percent' ? 0 : ymin,
                            max: unit === 'percent' ? 100 : null
                        });
                        rec.set('yaxis', i + 1);
                    }
                }, this);
            }
            Ext.each(this.flotOptions.yaxes, function(yaxis) {
                yaxis.tickFormatter = Ext.iG.Util.yTickFormatter;
            }, this);
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
        // TODO(el): Redundant code, see annotate.
        if(this.fireEvent('plotclick', this, item) !== false) {
            if(this.commentCtxEnabled === true) {
                var hosts = [], services = [];
                this.store.getHostsAndServices(hosts, services);
                var cfg = {
                    xtype: 'igcomment',
                    minDate: new Date(this.store.getStart()*1000),
                    maxDate: new Date(this.store.getEnd()*1000),
                    hosts: hosts,
                    services: services,
                    listeners: {
                        scope: this,
                        addcomment: function(form) {
                            this.store.reload();
                            form.ownerCt.destroy();
                        },
                        cancel: function(form) {
                            form.ownerCt.destroy();
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
                new Ext.Window({
                    title: _('Comment'),
                    collapsible: true,
                    width: 300,
                    height: 255,
                    layout: 'fit',
                    plain: true,
                    modal: true,
                    bodyStyle: 'padding:5px;',
                    buttonAlign: 'center',
                    items: cfg
                }).show();
                this.disableCommentCtx();
            }
        }
    },
    
    annotate: function() {
        // TODO(el): Redundant code, see onPlotClick.
        var yaxis = this.$plot.getYAxes()[0],
            y = Math.floor((yaxis.min + yaxis.max)*0.75);
        Ext.each(this.store.getComments(), function(comment) {
            var o = this.$plot.pointOffset({
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
            Ext.iG.CommentMgr.register(comment.id, el);
            el.on({
                scope: this,
                click: function(e) {
                    var hosts = [], services = [];
                    this.store.getHostsAndServices(hosts, services);
                    var cfg = {
                        xtype: 'igcomment',
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
                            editcomment: function(form) {
                                this.store.reload();
                                form.ownerCt.destroy();
                            },
                            deletecomment: function(form) {
                                Ext.iG.CommentMgr.unregister(form.comment_id);
                                form.ownerCt.destroy();
                            },
                            cancel: function(form) {
                                form.ownerCt.destroy();
                            }
                        }
                    };
                    new Ext.Window({
                        title: _('Comment'),
                        collapsible: true,
                        width: 300,
                        height: 255,
                        layout: 'fit',
                        plain: true,
                        modal: true,
                        bodyStyle: 'padding:5px;',
                        buttonAlign: 'center',
                        items: cfg
                    }).show();
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
                    if(rec.get('enabled') !== true) {
                        return;
                    }
                    if(Ext.isFunction((c = rec.get('convert')))) {
                        var scope = {},
                            snapshot = Ext.pluck(this.store.getRange(),
                                                 'data');
                        Ext.each(rec.get('data'), function(xy) {
                            try {
                                y = c.call(scope, xy[1], xy[0], snapshot);
                            } catch(e) {
                                // TODO(el): Notify
                                console.log(e);
                                return false;
                            }
                            if(y !== xy[1] &&
                               (Ext.isNumber(y) || y === null)) {
                                xy[1] = y;
                            }
                        });
                    }
                    series.push(rec.data);
                });
            }
            if(id === undefined) {
                id = this.id;
            }
            if(this.absolute) {
                // Force full view of timerange even if there's no data.
                Ext.apply(this.flotOptions.xaxis, {
                    min: this.store.getStart()*1000,
                    max: this.store.getEnd()*1000
                });
            }
            this.$plot = $.plot($('#' + id), series, this.flotOptions);
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
    
    onDataChanged: function() {
        this.plot();
    },
    
    onUpdate: function() {
        this.delayPlot();
    },
    
    onDestroy: function() {
        if (this.refreshTask && this.refreshTask.cancel) {
            this.refreshTask.cancel();
        }
        this.bindStore(null);
        if(this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
        if(this.shint) {
            this.shint.destroy();
            this.shint = null;
        }
        Ext.iG.Flot.superclass.onDestroy.call(this);
    },
    
    reset: function() {
        // Reset flotOptions
        this.flotOptions = iG.merge(true, {}, this.defaultFlotOptions,
                                    this.initialConfig.flotOptions);
        this.flotOptions.xaxis.tickFormatter = Ext.iG.Util.xTickFormatter;
        this.on({
            scope: this,
            single: true,
            beforeplot: this.applyTemplate
        });
        var series = [];
        this.template.each(function(rec) {
            series.push(rec.data);
        });
        this.store.baseParams.query = Ext.encode(
            Ext.iG.Util.buildQuery(series));
        this.store.load();
    }
});
Ext.reg('flot', Ext.iG.Flot);
Ext.iG.Flot.tooltipTemplate = new Ext.Template(
    '<div class = "iG-tooltip">',
    '<h3>{label}</h3>',
    '<div>{x} : {y}</div>',
    '</div>', {compiled: true, disableFormats: true});
Ext.iG.Flot.sHintTpl = new Ext.Template(
    '<div class = "iG-tooltip">',
    '<div><p><b>' + _('Start') + ' : </b> {from}</p></div>',
    '<div><p><b>' + _('End') + ' : </b> {to}</p></div>',
    '</div>', {compiled: true, disableFormats: true});