Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Toolbar
 * @extends Ext.Toolbar
 */
Ext.iG.Toolbar = Ext.extend(Ext.Toolbar, {
    firstText: _(''),
    prevText: _(''),
    nextText: _(''),
    lastText: _(''),
    refreshText: _(''),
    downloadText: _(''),
    printText: _(''),
    
    constructor: function(cfg) {
        var items = [this.first = new Ext.Toolbar.Button({
            tooltip: this.firstText,
            overflowText: this.firstText,
            iconCls: 'x-tbar-page-first',
            disabled: true,
            handler: this.moveFirst,
            scope: this
        }), this.prev = new Ext.Toolbar.Button({
            tooltip: this.prevText,
            overflowText: this.prevText,
            iconCls: 'x-tbar-page-prev',
            disabled: true,
            handler: this.movePrevious,
            scope: this
        }), '-', _('Interval'),
        this.input = new Ext.form.ComboBox({
            width: 100,
            store: new Ext.iG.TimeFrames(),
            valueField: 'name',
            displayField: 'name',
            mode: 'local',
            triggerAction: 'all',
            value: cfg.activeFrame !== undefined ? cfg.activeFrame : '',
            listeners: {
                scope: this,
                select: this.inputChange
            }
        }),'-', this.next = new Ext.Toolbar.Button({
            tooltip: this.nextText,
            overflowText: this.nextText,
            iconCls: 'x-tbar-page-next',
            disabled: true,
            handler: this.moveNext,
            scope: this
        }), this.last = new Ext.Toolbar.Button({
            tooltip: this.lastText,
            overflowText: this.lastText,
            iconCls: 'x-tbar-page-last',
            disabled: true,
            handler: this.moveLast,
            scope: this
        }), '-', this.refresh = new Ext.Toolbar.Button({
            tooltip: this.refreshText,
            overflowText: this.refreshText,
            iconCls: 'x-tbar-loading',
            disabled: true,
            handler: this.doRefresh,
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
        this.smooth = new Ext.form.Checkbox({
            boxLabel: _('Smooth'),
            disabled: true,
            scope: this,
            handler: function(box, checked) {
                this.store.each(function(rec) {
                    linesCfg = rec.get('lines');
                    iG.merge(true, linesCfg, {
                        spline: checked
                    });
                    rec.set('lines', linesCfg);
                    rec.commit();
                });
            },
            style: {
                marginTop: '0px'
            }
        }),
        this.settings = new Ext.Toolbar.Button({
            iconCls: 'icinga-icon-cog',
            scope: this,
            handler: function() {
                Ext.Msg.alert(_('Settings'), _('Sorry, not yet implemented'));
            }
        }),
        this.comments = new Ext.Toolbar.Button({
            iconCls: 'icinga-icon-comment',
            scope: this,
            handler: function() {
                Ext.Msg.alert(_('Comments'), _('Sorry, not yet implemented'));
            }
        }), '->',
        this.download = new Ext.Toolbar.Button({
            iconCls: 'ingraph-icon-document-export',
            tooltip: this.downloadText,
            menu: {
                defaults: {
                    scope: this
                },
                items: [{
                    text: 'XML',
                    handler: function() {
                        this.doDownload('xml');
                    }
                }, {
                   text: 'CSV',
                   handler: function() {
                       this.doDownload('csv');
                   }
                }]
            },
        }),
        this.print = new Ext.Toolbar.Button({
            iconCls: 'icon-print',
            scope: this,
            tooltip: this.printText,
            handler: function() {
                if(this.fireEvent('beforeprint', this) !== false) {
                    window.print();
                }
            }
        })];
        
        cfg.items = items;
        Ext.iG.Toolbar.superclass.constructor.call(this, cfg);
    },
    
    initComponent: function() {
        Ext.iG.Toolbar.superclass.initComponent.call(this);
        this.addEvents('beforeprint');
        this.bindStore(this.store, true);
    },
    
    bindStore: function(store, initial){
        if(!initial && this.store){
            if(store !== this.store && this.store.autoDestroy){
                this.store.destroy();
            } else {
                this.store.un('beforeload', this.onBeforeLoad, this);
                this.store.un('load', this.onLoad, this);
            }
            if(!store){
                this.store = null;
            }
        }
        if(store){
            store.on({
                scope: this,
                beforeload: this.onBeforeLoad,
                load: this.onLoad
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
        this.datapoints.enable();
        this.smooth.enable();
        if(this.store.getStart() === this.store.getMintimestamp()) {
            this.first.disable();
            this.prev.disable();
        } else {
            this.first.enable();
            this.prev.enable();
        }
        this.next.enable();
        this.last.enable();
    },
    
    onDestroy: function() {
        this.bindStore(null);
        Ext.iG.Toolbar.superclass.onDestroy.call(this);
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
    
    inputChange: function(c, rec) {
        var lastFrame = this.lastFrame !== undefined ?
                        this.lastFrame : this.activeFrame; 
        if(rec.get('name') !== lastFrame) {
            this.first.enable();
        } else if(this.store.getStart() ===
                  this.store.getMintimestamp()) {
            this.first.disable();
        }
        
        var s = this.store.getStart()*1000,
            e = this.store.getEnd()*1000,
            i = rec.get('interval')/2*1000,
            m = s+(e-s)/2,
            min = this.store.getMintimestamp()*1000,
            max = this.store.getMaxtimestamp()*1000,
            ns = m - i,
            ne = m + i;
       if(ns < min) {
           ns = min;
       }
       if(ne > max) {
           ne = max;
       }
       this.store.load({
           params: {
               start: Math.ceil(ns/1000),
               end: Math.ceil(ne/1000)
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
    }
});
