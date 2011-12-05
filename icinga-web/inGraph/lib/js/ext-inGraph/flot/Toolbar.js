Ext.ns('Ext.iG.flot');
/**
 * @class Ext.iG.flot.Toolbar
 * @extends Ext.Toolbar
 */
Ext.iG.flot.Toolbar = Ext.extend(Ext.Toolbar, {
    pageTextIfDisabled: _('Please choose data view first'),
    prevTextIfMin: _('Older data not available'),
    firstText: new Ext.XTemplate(
        _('Start of available {adv} data'), {compiled: true}),
    prevText: new Ext.XTemplate(
        _('Back {[values.name.toLowerCase()]}'), {compiled: true}),
    inputText: _('Choose data view'),
    nextText: new Ext.XTemplate(
        _('Forward {[values.name.toLowerCase()]}'), {compiled: true}),
    lastText: new Ext.XTemplate(
        _('Latest available {adv} data'), {compiled: true}),
    refreshText: _('Reload chart'),
    syncText: _('Synchronize start and end points of all charts with this ' + 
                'chart'),
    settingsText: _('Change settings of this chart'),
    commentsText: _('Add comment to this chart'),
    downloadText: _('Export data'),
    printText: _('Print chart'),
    
    constructor: function(cfg) {
        var items = [this.first = new Ext.Toolbar.Button({
            tooltip: this.pageTextIfDisabled,
            iconCls: 'x-tbar-page-first',
            disabled: true,
            handler: this.moveFirst,
            scope: this
        }), this.prev = new Ext.Toolbar.Button({
            tooltip: this.pageTextIfDisabled,
            iconCls: 'x-tbar-page-prev',
            disabled: true,
            handler: this.movePrevious,
            scope: this
        }), '-',
        this.input = new Ext.form.ComboBox({
            emptyText: _('Choose data view'),
            width: 130,
            store: new Ext.iG.TimeFrames(),
            valueField: 'name',
            displayField: 'name',
            mode: 'local',
            triggerAction: 'all',
            value: cfg.activeFrame !== undefined ? cfg.activeFrame : '',
            style: {
                paddingTop: '1px'
            },
            qtip: this.inputText,
            listeners: {
                scope: this,
                select: this.onSelectDataView,
                render: function(combo) {
                    new Ext.ToolTip({
                        dismissDelay: 0,
                        target: combo.el,
                        html: combo.qtip
                    });
                }
            }
        }),'-', this.next = new Ext.Toolbar.Button({
            tooltip: this.pageTextIfDisabled,
            iconCls: 'x-tbar-page-next',
            disabled: true,
            handler: this.moveNext,
            scope: this
        }), this.last = new Ext.Toolbar.Button({
            tooltip: this.pageTextIfDisabled,
            iconCls: 'x-tbar-page-last',
            disabled: true,
            handler: this.moveLast,
            scope: this
        }), '-', this.refresh = new Ext.Toolbar.Button({
            tooltip: this.refreshText,
            iconCls: 'x-tbar-loading',
            disabled: true,
            handler: this.doRefresh,
            scope: this
        }), '-', 
        this.sync = new Ext.Toolbar.Button({
            tooltip: this.syncText,
            iconCls: 'ingraph-icon-sync',
            disabled: true,
            handler: this.doSync,
            scope: this
        }), '-',
        this.datapoints = new Ext.form.Checkbox({
            boxLabel: _('Show datapoints'),
            disabled: true,
            scope: this,
            handler: function(box, checked) {
                this.store.each(function(rec) {
                    pointsCfg = rec.get('points');
                    iG.merge(true, pointsCfg, {
                        show: checked
                    });
                    rec.set('points', pointsCfg);
                    rec.commit();
                });
            },
            style: {
                marginTop: '0px'
            }
        }),
//        this.smooth = new Ext.form.Checkbox({
//            boxLabel: _('Smooth'),
//            disabled: true,
//            scope: this,
//            handler: function(box, checked) {
//                this.store.each(function(rec) {
//                    linesCfg = rec.get('lines');
//                    iG.merge(true, linesCfg, {
//                        spline: checked
//                    });
//                    rec.set('lines', linesCfg);
//                    rec.commit();
//                });
//            },
//            style: {
//                marginTop: '0px'
//            }
//        }),
        this.settings = new Ext.Toolbar.Button({
            tooltip: this.settingsText,
            iconCls: 'ingraph-icon-settings',
            scope: this,
            handler: function() {
                new Ext.Window({
                    title: _('Settings'),
                    layout: 'fit',
                    width: 450,
                    height: 300,
                    collapsible: true,
                    modal: true,
                    items: new Ext.iG.Settings({
                        baseCls: 'x-plain',
                        store: this.ownerCt.template,
                        listeners: {
                            scope: this,
                            cancel: function(s) {
                                s.ownerCt[s.ownerCt.closeAction]()
                            },
                            applysettings: function(s) {
                                this.ownerCt.applyTemplate();
                            }
                        }
                    })
                }).show();
            }
        }),
        this.comments = new Ext.Toolbar.Button({
            tooltip: this.commentsText,
            iconCls: 'ingraph-icon-comment',
            scope: this,
            handler: function(btn, e) {
                new Ext.ToolTip({
                    title: _('Comments'),
                    renderTo: Ext.getBody(),
                    anchor: 'left',
                    target: btn.el,
                    html: _('Trigger comment dialog by clicking the plot.'),
                    listeners: {
                        hide: function(self) {
                            self.destroy();
                        }
                    }
                }).show();
                this.ownerCt.flot.enableCommentCtx();
            }
        }), '->',
        this.download = new Ext.Toolbar.Button({
            tooltip: this.downloadText,
            iconCls: 'ingraph-icon-document-export',
            menu: {
                defaults: {
                    scope: this
                },
                items: [{
                    text: 'XML',
                    iconCls: 'ingraph-icon-document-xml',
                    handler: function() {
                        this.doDownload('xml');
                    }
                }, {
                   text: 'CSV',
                   iconCls: 'ingraph-icon-document-csv',
                   handler: function() {
                       this.doDownload('csv');
                   }
                }]
            }
        }),
        this.print = new Ext.Toolbar.Button({
            tooltip: this.printText,
            iconCls: 'ingraph-icon-print',
            scope: this,
            handler: function() {
                if(this.fireEvent('beforeprint', this) !== false) {
                    window.print();
                }
            }
        })];
        
        cfg.items = items;
        Ext.iG.flot.Toolbar.superclass.constructor.call(this, cfg);
    },
    
    initComponent: function() {
        Ext.iG.flot.Toolbar.superclass.initComponent.call(this);
        this.addEvents('beforeprint', 'syncframe');
        this.bindStore(this.store, true);
    },
    
    bindStore: function(store, initial){
        if(!initial && this.store){
            if(store !== this.store && this.store.autoDestroy){
                this.store.destroy();
            } else {
                this.store.un('beforeload', this.onBeforeLoad, this);
                this.store.un('load', this.onLoad, this);
                this.store.un('exception', this.onLoadError, this);
            }
            if(!store){
                this.store = null;
            }
        }
        if(store){
            store.on({
                scope: this,
                beforeload: this.onBeforeLoad,
                load: this.onLoad,
                exception: this.onLoadError
            });
            this.store = store;
        }
    },
    
    onBeforeLoad: function() {
        if(this.rendered && this.refresh){
            this.refresh.disable();
        }
        this.lastFrame = this.input.getValue();
    },
    
    onLoad: function() {
        this.refresh.enable();
        this.sync.enable();
        this.datapoints.enable();
//        this.smooth.enable();
        if(this.input.getValue()) {
            if(this.store.getStart() <= this.store.getMintimestamp()) {
                this.first.disable();
                this.prev.disable();
                this.first.setTooltip(this.prevTextIfMin);
                this.prev.setTooltip(this.prevTextIfMin);
            } else {
                this.first.enable();
                this.prev.enable();
            }
            
            this.next.enable();
            this.last.enable();
        }
    },
    
    onLoadError: function() {
        if(this.rendered) {
            this.refresh.enable();
        }
    },
    
    onDestroy: function() {
        this.bindStore(null);
        Ext.iG.flot.Toolbar.superclass.onDestroy.call(this);
    },
    
    doRefresh: function() {
        this.store.reload();
    },
    
    moveFirst: function() {
        var rec = this.input.store.getById(this.input.getValue());
        if(rec) {
            var s = this.store.getMintimestamp()*1000,
                i = rec.get('interval')*1000,
                e = s+i;
            this.store.load({
                params: {
                    start: Math.ceil(s/1000),
                    end: Math.ceil(e/1000)
                }
            });
        }
    },
    
    movePrevious: function() {
        var rec = this.input.store.getById(this.input.getValue());
        if(rec) {
            var e = this.store.getStart()*1000,
                i = rec.get('interval')*1000,
                s = e-i,
                min = this.store.getMintimestamp()*1000;
            if(s < min) {
                s = min;
                e = s+i;
            }
            this.store.load({
                params: {
                    start: Math.ceil(s/1000),
                    end: Math.ceil(e/1000)
                }
            });
        }
    },
    
    onSelectDataView: function(c, rec) {
        if(rec.get('name') !== this.lastFrame) {
            this.first.setTooltip(this.firstText.apply(rec.data));
            this.prev.setTooltip(this.prevText.apply(rec.data));
            this.next.setTooltip(this.nextText.apply(rec.data));
            this.last.setTooltip(this.lastText.apply(rec.data));
        }
        this.store.load({
            params: {
                start: Math.ceil(strtotime(rec.get('start'))),
                end: Math.ceil(strtotime('now'))
            }
       });
    },
    
    moveNext: function() {
        var rec = this.input.store.getById(this.input.getValue());
        if(rec) {
            var s = this.store.getEnd()*1000,
                i = rec.get('interval')*1000,
                e = s+i,
                now = new Date().getTime();
            if(e > now) {
                e = now; // Do not try to plot future values. ;-)
            }
            if((e-s) < i) { 
                s = e - i; // ALWAYS view full selected range.
            }
            this.store.load({
                params: {
                    start: Math.ceil(s/1000),
                    end: Math.ceil(e/1000)
                }
            });
        }
    },
    
    moveLast: function() {
        var rec = this.input.store.getById(this.input.getValue());
        if(rec) {
            this.store.load({
                params: {
                    start: Math.ceil(strtotime(rec.get('start'))),
                    end: Math.ceil(strtotime(rec.get('end')))
                }
            });
        }
    },
    
    doDownload: function(ot) {
        var body = Ext.getBody();
        var frame = body.createChild({
            tag: 'iframe',
            cls: 'x-hidden'
        });
        var form = body.createChild({
            tag: 'form',
            cls: 'x-hidden',
            action: this.store.url + '.' + ot,
            method: 'POST',
            children: [{
                type: 'text',
                tag: 'input',
                cls: 'x-hidden',
                name: 'start',
                value: this.store.getStart()
            }, {
                type: 'text',
                tag: 'input',
                cls: 'x-hidden',
                name: 'end',
                value: this.store.getEnd()
            }, {
                type: 'text',
                tag: 'input',
                cls: 'x-hidden',
                name: 'query',
                value: Ext.util.Format.htmlEncode(this.store.getQuery())
            }]
        });
        frame.appendChild(form);
        form.dom.submit();
        Ext.destroy(form, frame);
    },
    
    doSync: function() {
        var start = this.store.lastOptions.params &&
                    this.store.lastOptions.params.start ||
                    this.store.baseParams.start,
            end = this.store.lastOptions.params &&
                  this.store.lastOptions.params.end ||
                  this.store.baseParams.end;
        this.fireEvent('syncframe', this, start, end);
    }
});
Ext.reg('flottbar', Ext.iG.flot.Toolbar);