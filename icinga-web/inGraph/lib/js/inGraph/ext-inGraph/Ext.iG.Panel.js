Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Panel
 * @extends Ext.Panel
 */
Ext.iG.Panel = Ext.extend(Ext.Panel, {
    header: false,
    autoScroll: true,
    stateful: true,
    stateEvents: [],
    layout: 'anchor',
    defaults: {
        xtype: 'flotpanel',
        bodyStyle: 'padding: 2px;'
    },
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.Panel.superclass.initComponent.call(this);
    },
    
    initEvents: function() {
        Ext.iG.Panel.superclass.initEvents.apply(this, arguments);
        this.addEvents(
            '__igpanel__complete',
            '__igpanel__fail'
        );
    },
    
    fromView: function(cfg) {
        if(this.view) {
            var items = [];
            var callback = function(template) {
                this.setTitle(template.title || _('View (No Title)'));
                Ext.each(template.panels, function(panel) {
                    var query = {};
                    Ext.each(panel.series, function(series) {
                        var qpart = query;
                        Ext.iterate([series.host, series.service],
                            function(v) {
                             if(!Ext.isObject(qpart[v])) {
                                 qpart[v] = {};
                             }
                             qpart = qpart[v];
                        }, this);
                        if(!Ext.isArray(qpart[series.plot])) {
                            qpart[series.plot] = [];
                        }
                        qpart = qpart[series.plot];
                        if(qpart.indexOf(series.type) === -1) {
                            qpart.push(series.type);
                        }
                    }, this);
                    query = Ext.encode(query);
                    items.push({
                        titleFormat: '{interval}',
                        title: panel.title || _('Panel (No Title)'),
                        template: panel,
                        store: new Ext.iG.FlotJsonStore({
                            url: this.provider.values,
                            baseParams: {
                                query: query,
                                start: panel.start ?
                                       Math.ceil(strtotime(panel.start)) :
                                       null,
                                end: panel.end ?
                                     Math.ceil(strtotime(panel.end)) :
                                     null,
                                interval: panel.interval || null
                            }
                        })
                    });
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
    
    fromHost: function(cfg) {
        if(this.host && !this.service) {
            cfg.title = _('Services For') + ' ' + this.host;
            cfg.items = new Ext.iG.HostSummary({
                provider: this.provider,
                host: this.host
            });
            return true;
        }
        return false;
    },
    
    fromHostService: function(cfg) {
        if(this.host && this.service) {
            var items = [];
            cfg.title = this.host + ' - ' + this.service;
            var callback = function(template) {
                var query = {}
                query[this.host] = {};
                query[this.host][this.service] = {};
                Ext.each(template.series, function(series) {
                    query[this.host][this.service][series.plot] = Ext.isArray(
                        series.type) ? series.type : [series.type];
                }, this);
                query = Ext.encode(query);
                if(this.start || this.end) {
                    items.push(Ext.apply({}, {
                        title: this.start + ' - ' + this.end,
                        host: this.host,
                        service: this.service,
                        template: template,
                        store: new Ext.iG.FlotJsonStore({
                            url: this.provider.values,
                            baseParams: {
                                query: query,
                                start: this.start,
                                end: this.end
                            }
                        })
                    }, this.panelsCfg));
                } else {
                    this.timeFrames.each(function(rec) {
                        if(rec.get('enabled')) {
                            items.push({
                                title: rec.get('name'),
                                activeFrame: rec.get('name'),
                                host: this.host,
                                service: this.service,
                                template: template,
                                store: new Ext.iG.FlotJsonStore({
                                    url: this.provider.values,
                                    baseParams: {
                                        query: query,
                                        start: Math.ceil(
                                            strtotime(rec.get('start'))),
                                        end: Math.ceil(strtotime(rec.get('end')))
                                    }
                                }),
                                overview: rec.get('overview')
                            });
                        }
                    }, this);
                }
                this.add(items);
                this.doLayout();
            };
            var params = {
                host: this.host,
                service: this.service
            };
            this.requestTemplate(this.provider.template, params, callback);
            return true;
        }
        return false;
    },
    
    buildItems: function(cfg) {
        var items = [];
        Ext.each([this.fromHostService, this.fromView, this.fromHost],
                 function(fn) {
            return !fn.call(this, cfg);
        }, this);
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
