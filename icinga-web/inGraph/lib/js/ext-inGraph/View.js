Ext.ns('Ext.iG');
/**
 * @class Ext.iG.View
 * @extends Ext.Container
 */
Ext.iG.View = Ext.extend(Ext.Container, {
    autoScroll: true,
    stateful: true,
    stateEvents: [],
    panelsCfg: {},
    layout: 'anchor',
    defaults: {
        xtype: 'flotpanel',
        bodyStyle: 'padding: 2px;',
        anchor: '100%'
    },
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
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
                    // TODO
                    panel.store.load({params: {start: start, end: end}});
                });
            }
        });
    },
    
    fromView: function(cfg) {
        if(this.view) {
            var items = [];
            var callback = function(template) {
                Ext.each(template.panels, function(panel) {
                    var query = Ext.encode(Ext.iG.Util.buildQuery(panel.series));
                    items.push(Ext.apply({}, {
                        titleFormat: '{title}',
                        title: panel.title || _('Panel (No Title)'),
                        template: panel,
                        store: new Ext.iG.FlotJsonStore({
                            url: this.provider.values,
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
            this.requestTemplate(this.provider.view, params, callback);
            return true;
        }
        return false;
    },
    
    fromHostService: function(cfg) {
        if(this.host) {
            var callback = function(template) {
                var items = [];
                var query = Ext.encode(
                    Ext.iG.Util.buildQuery(template.series));
                if(this.start || this.end) {
                    this.panels = new Ext.iG.Panels({
                        data: [{ start: this.start,
                                 end: this.end}]
                    });
                } else {
                    this.panels = new Ext.iG.Panels({ data: template.panels});
                }
                this.panels.each(function(panel) {
                    items.push(Ext.apply({}, {
                        title: panel.get('title'),
                        titleFormat: panel.get('titleFormat'),
                        host: this.host,
                        service: this.service,
                        template: new Ext.iG.Template(
                                      { data: template}),
                        overview: panel.get('overview'),
                        store: new Ext.iG.FlotJsonStore({
                            url: this.provider.values,
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
                this.provider.template,
                { host: this.host, service: this.service},
                callback);
            return true;
        }
        return false;
    },
    
    buildItems: function(cfg) {
        Ext.each([this.fromHostService, this.fromView],
                 function(fn) { return !fn.call(this, cfg);}, this);
    },
    
    getState: function() {
        var panels = [];
        this.items.each(function(panel) {
            panels.push(panel.getState());
        });
        return {
            panels: panels
        };
    },
    
    applyState: function(state) {
        Ext.each(state.panels, function(panel) {
            if(panel.store) {
                panel.store = new Ext.iG.FlotJsonStore(panel.store);
            }
            panel.template = new Ext.iG.Template(
                {data: panel.template}); // TODO
            this.add(panel);
        }, this);
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
    }
});
