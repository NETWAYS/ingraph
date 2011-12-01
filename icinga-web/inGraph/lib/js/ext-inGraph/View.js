Ext.ns('Ext.iG');
/**
 * @class Ext.iG.View
 * @extends Ext.Panel
 */
Ext.iG.View = Ext.extend(Ext.Panel, {
    autoScroll: true,
    stateful: true,
    stateEvents: [],
    panelsCfg: {},
    layout: 'anchor',
    baseCls: 'x-plain',
    downloadText: _('Export data'),
    printText: _('Print charts'),
    saveText: _('Save...'),
    defaults: {
        xtype: 'flotpanel',
        bodyStyle: 'padding: 2px;',
        anchor: '100%'
    },
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
//        this.buildTbar(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.View.superclass.initComponent.call(this);
        this.addEvents(
            '__igpanel__complete',
            '__igpanel__fail',
            'syncframe'
        );
        this.initEvents();
    },
    
    initEvents: function() {
        this.on({
            scope: this,
            syncframe: function(tbar, start, end) {
                this.items.each(function(panel) {
                    panel.store.load({params: {start: start, end: end}});
                });
            },
            add: function(ct, cmp) {
                cmp.on({
                    scope: this,
                    addpanel: function(panel) {
                        // TODO(el): Triggers multiple times in some circumstances
                        var index = this.items.indexOfKey(panel.id),
                            cfg = panel.getState();
                        this.fromState(cfg);
                        this.insert(index, cfg);
                        this.doLayout();
                    },
                    removepanel: function(panel) {
                        if(this.items.getCount() > 1) {
                            panel.destroy();
                        } else {
                            // TODO(el): Notify
                        }
                    }
                });
            }
        });
    },
    
    fromView: function(cfg) {
        if(this.view) {
            var items = [];
            var callback = function(template) {
                this.__view__ = template;
                this.panels = new Ext.iG.Panels({data: template.panels});
                this.panels.each(function(panel) {
                    var query = Ext.encode(
                        Ext.iG.Util.buildQuery(panel.json.series));
                    items.push(Ext.apply({}, {
                        titleFormat: '{title}',
                        title: panel.get('title'),
                        template: new Ext.iG.Template({data: panel.json}),
                        store: new Ext.iG.FlotJsonStore({
                            url: Ext.iG.Urls.provider.values,
                            baseParams: {
                                query: query,
                                start: panel.get('start'),
                                end: panel.get('end')
                            }
                        })
                   }, this.panelsCfg));
                }, this);
                this.add(items);
                this.doLayout();
            };
            var params = {
                view: this.view
            };
            this.requestTemplate(Ext.iG.Urls.provider.view, params, callback);
            return true;
        }
        return false;
    },
    
    fromHostService: function(cfg) {
        if(this.host) {
            var callback = function(template) {
                this.__template__ = template;
                template = template.content;
                var items = [];
                if(this.start || this.end) {
                    this.panels = new Ext.iG.Panels({
                        data: [{start: this.start,
                                end: this.end}]
                    });
                } else {
                    this.panels = new Ext.iG.Panels({ data: template.panels});
                }
                this.panels.each(function(panel) {
                    var query = Ext.encode(
                        Ext.iG.Util.buildQuery(panel.series || template.series));
                    items.push(Ext.apply({}, {
                        title: panel.get('title'),
                        titleFormat: panel.get('titleFormat'),
                        host: this.host,
                        service: this.service,
                        template: new Ext.iG.Template({data: template}),
                        overview: panel.get('overview'),
                        store: new Ext.iG.FlotJsonStore({
                            url: Ext.iG.Urls.provider.values,
                            baseParams: {
                                query: query,
                                start: panel.get('start'),
                                end: panel.get('end')
                            }
                        })
                    }, this.panelsCfg));
                }, this);
                this.add(items);
                this.doLayout();
            };
            this.requestTemplate(
                Ext.iG.Urls.provider.template,
                {host: this.host, service: this.service},
                callback);
            return true;
        }
        return false;
    },
    
    buildItems: function(cfg) {
        Ext.each([this.fromHostService, this.fromView],
                 function(fn) { return !fn.call(this, cfg);}, this);
    },
    
    buildTbar: function(cfg) {
        cfg.tbar = [{
            text: _('Save'),
            tooltip: this.saveText,
            iconCls: 'ingraph-icon-save',
            scope: this,
            handler: this.onSave
        }, '->', /*{
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
                        this.onDownload('xml');
                    }
                }, {
                   text: 'CSV',
                   iconCls: 'ingraph-icon-document-csv',
                   handler: function() {
                       this.onDownload('csv');
                   }
                }]
            }
        },*/ {
            tooltip: this.printText,
            iconCls: 'ingraph-icon-print',
            scope: this,
            handler: this.onPrint
        }];
    },
    
    getState: function() {
        var panels = [];
        this.items.each(function(panel) {
            panels.push(panel.getState());
        });
        return {
            panels: panels,
            __template__: this.__template__,
            __view__: this.__view__
        };
    },
    
    applyState: function(state) {
        Ext.each(state.panels, function(panel) {
            this.fromState(panel);
            this.add(panel);
        }, this);
        this.__template__ = state.__template__;
        this.__view__ = state.__view__;
    },
    
    fromState: function(panel) {
        panel.store = new Ext.iG.FlotJsonStore(panel.store);
        panel.template = new Ext.iG.Template({data: panel.template});
        delete panel.id;
    },
    
    requestTemplate: function(url, params, callback) {
        Ext.Ajax.request({
           url: url,
           scope: this,
           success: function(res) {
               var template = null;
               if(res.responseText) {
                   template = Ext.decode(res.responseText);
               }
               callback.call(this, template);
               this.fireEvent('__igpanel__complete', this);
           },
           failure: function() {
               this.fireEvent('__igpanel__fail', this, arguments);
           },
           params: params
        });
    },
    
    onSave: function() {
        var panels = [];
        this.items.each(function(panel) {
            var cfg = {
                start: panel.store.baseParams.start,
                end: panel.store.baseParams.end,
                titleFormat: panel.titleFormat,
                title: panel.initialConfig.title,
                overview: panel.overview ? true : false
            };
            Ext.apply(cfg, panel.template.toHash());
            panels.push(cfg);
        });
        Ext.Ajax.request({
            url: Ext.iG.Urls.templates.edit,
            params: {
                content: Ext.encode({
                    panels: panels
                }),
                name: this.__template__.name
            },
            scope: this,
            success: function() { console.log(arguments);},
            failure: function() { console.log(arguments);}
        });
    },
    
    onDownload: function() {
        
    },
    
    onPrint: function() {
        this.items.each(function(panel) {
            panel.preparePrint();
        });
        window.print();
    }
});
Ext.iG.View.TYPE_
