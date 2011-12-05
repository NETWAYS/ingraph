Ext.ns('Ext.iG.flot');
Ext.iG.flot.Panel = Ext.extend(Ext.Panel, {
    loadMask: true,
    overview: false,
    emptyText: _('No Data'),
    showEmpty: false,
    collapsible: true,
    animCollapse: true,
    height: 220,
    layout: 'vbox',
    layoutConfig: {
        align: 'stretch',
        pack: 'start'
    },
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        this.buildTbar(cfg);
        this.buildTools(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.flot.Panel.superclass.initComponent.call(this);
        this.addEvents('addpanel', 'removepanel');
    },
    
    buildItems: function(cfg) {
        var items = [this.flot = new Ext.iG.Flot(Ext.apply({}, {
            store: this.store,
            template: this.template,
            flex: 1
        }, this.flotCfg))];
        if(this.overview) {
            var height = this.overview !== true ? this.overview : '25%';
            items.push(new Ext.Spacer({height:1, cls: 'iG-spacer'}));
            items.push(cfg.overview = new Ext.iG.Flot({
                template: this.template,
                flotOptions: {
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
                        hoverable: false,
                        clickable: false
                    },
                    selection: {
                        mode: 'x',
                        color: '#FA5C0D'
                    }
                },
                height: height,
                store: new Ext.iG.FlotJsonStore({
                    url: this.store.url,
                    baseParams: { query: this.store.baseParams.query}
                })
            })); // eof items.push
        }
        cfg.items = items;
    },
    
    buildTbar: function(cfg) {
        if(this.tbar !== false) {
            cfg.tbar = {
                xtype: 'flottbar',
                store: this.store,
                bubbleEvents: ['add', 'remove', 'syncframe'],
                listeners: {
                    scope: this,
                    beforeprint: function() {
                        this.preparePrint();
                    }
                }
            };
        }
    },
    
    buildTools: function(cfg) {
        if(this.tools !== false) {
            cfg.tools = [{
                id: 'plus',
                qtip: _('Add panel to view'),
                scope: this,
                handler: this.onAddPanel
            }, {
                id: 'close',
                qtip: _('Remove this panel'),
                scope: this,
                handler: this.onRemovePanel
            }];
        }
    },
    
    onAddPanel: function() {
        this.fireEvent('addpanel', this);
    },
    
    onRemovePanel: function() {
        this.fireEvent('removepanel', this);
    },
    
    initEvents: function() {
        Ext.iG.flot.Panel.superclass.initEvents.call(this);
        if(this.loadMask) {
            this.loadMask = new Ext.LoadMask(this.bwrap,
                Ext.apply({
                    store: this.store,
                    removeMask: true
                }, this.loadMask)
            );
        }
        this.store.on({
            scope: this,
            single: true,
            load: function(store) {
                if(this.showEmpty === false) {
                    if(store.isEmpty()) {
                        this.setTitle(undefined, true);
                        this.collapse();
                    }
                }
                store.on({
                    scope: this,
                    load: function(store) {
                        if(store.isEmpty()) {
                            this.setTitle(undefined, true);
                        } else {
                            this.setTitle();
                        }
                    }
                });
            }
        });
        if(this.overview) {
            this.overview.on({
                scope: this,
                single: true,
                plot: function() {
                    /*
                     * TODO(el): Initial selection disappears.
                     */
                    this.overview.$plot.setSelection({
                        xaxis: {
                            from: this.store.getStart()*1000,
                            to: this.store.getEnd()*1000
                        }
                    }, true);
                    this.mon(this.flot.store, {
                        scope: this,
                        load: function(store) {
                            this.overview.$plot.setSelection({
                                xaxis: {
                                    from: store.getStart()*1000,
                                    to: store.getEnd()*1000
                                }
                            }, true);
                        }
                    });
                }
            });
            this.overview.on({
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
                    if(this.overview.$plot.getSelection()) {
                        tbar = this.getTopToolbar();
                        tbar.input.setValue(tbar.initialConfig.activeFrame);
                        this.store.load();
                        this.overview.$plot.clearSelection();
                    }
                    // Do NOT zoom out.
                    return false;
                },
                plotselecting: function(flot, ranges, pos) {
                    if(ranges) {
                        this.flot.store.stopRefresh();
                        var clipped = [];
                        Ext.each(this.overview.$plot.getData(),
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
                        this.flot.$plot = $.plot($('#' + this.flot.id),
                                                clipped, flotOptions);
                    }
                }
            });
        } // eof if overview
    },
    
    onDestroy: function() {
        Ext.iG.flot.Panel.superclass.onDestroy.call(this);
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
                html: this.title
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
        this.flot.plot(id);
        Ext.EventManager.addListener(window, 'focus', function() {
            Ext.destroy.defer(1000, this, [el]);
        }, this, {single: true});   
    },
    
    getState: function() {
        return {
            host: this.host,
            service: this.service,
            title: this.initialConfig.title,
            titleFormat: this.titleFormat,
            activeFrame: this.activeFrame,
            overview: this.overview !== false ? true : false,
            store: {
                url: this.store.url,
                baseParams: Ext.apply({}, this.store.lastOptions,
                                      this.store.baseParams) 
            },
            xtype: 'flotpanel',
            template: this.template.reader.jsonData
        };
    },
    
    setTitle: function(title, empty) {
        var titleFormat = this.titleFormat;
        if(empty === true) {
            titleFormat += ' (' + this.emptyText + ')';
        }
        title = String.format(titleFormat, {
            host: this.host,
            service: this.service,
            title: this.initialConfig.title
        });
        Ext.iG.flot.Panel.superclass.setTitle.call(this, title);
    },
    
    applyTemplate: function() {
        this.flot.reset();
        if(this.overview) {
            this.overview.reset();
        }
    }
});
Ext.reg('flotpanel', Ext.iG.flot.Panel);
