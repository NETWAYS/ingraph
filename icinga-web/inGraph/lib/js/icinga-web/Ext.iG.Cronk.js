Ext.ns('Ext.iG.Cronk');
/**
 * @class Ext.iG.Cronk
 * @singleton
 */
Ext.iG.Cronk = function() {
    var titleTpl = new Ext.XTemplate(
        '<tpl if="values.view">iG: {view}</tpl>',
        '<tpl if="!values.view">',
            'iG: {host}', '<tpl if="values.service"> - {service}</tpl>',
        '</tpl>',
        {compiled: true});
    
    return {
        open: function(cfg) {
            var cronk = {
                    id: Ext.id(),
                    title: cfg.title,
                    crname: 'inGraph',
                    iconCls: 'icinga-cronk-icon-stats2',
                    closable: true,
                    params: {
                        host: cfg.host,
                        service: cfg.service
                    }
                },
                tabs = Ext.getCmp('cronk-tabs'),
                panel = Cronk.factory(cronk);
            tabs.add(panel);
            tabs.setActiveTab(panel);
        },
        
        Window: function(cfg) {
            var win = new Ext.Window({
                title: cfg.title,
                width: cfg.width,
                layout: 'fit',
                items: new Ext.iG.View({
                    border: false,
                    tbar: false,
                    panelsCfg: {
                        height: cfg.height,
                        header: false,
                        showEmpty: true,
                        border: false,
                        overview: cfg.overview
                    },
                    host: cfg.host,
                    service: cfg.service,
                    start: cfg.start,
                    end: cfg.end
                }),
                tools: [{
                    id: 'pin',
                    qtip: _('Open Cronk'),
                    scope: this,
                    handler: function(event, toolEl, panel) {
                        this.open(cfg);
                    }
                }]
            });
            win.show();
        },
        
        Popup: function(cfg) {
            var tip = new Ext.ToolTip({
                title: cfg.title,
                target: cfg.target,
                renderTo: Ext.getBody(),
                anchor: 'left',
                dismissDelay: 0,
                width: cfg.width,
                items: new Ext.iG.View({
                    tbar: false,
                    autoScroll: false,
                    panelsCfg: {
                        header: false,
                        showEmpty: true,
                        tbar: false,
                        height: cfg.height,
                        flotCfg: {
                            flotOptions: {
                                legend: {
                                    show: false
                                },
                                yaxis: {
                                    show: false
                                },
                                grid: {
                                    hoverable: false,
                                    clickable: false
                                }
                            }
                        }
                    },
                    host: cfg.host,
                    service: cfg.service,
                    start: cfg.start,
                    end: cfg.end,
                    listeners: {
                        __igpanel__complete: function() {
                            this.ownerCt.doLayout();
                        }
                    }
                }),
                listeners: {
                    hide: function(self) {
                        self.destroy();
                    }
                }
            });
            tip.show();
        },
        
        setTitle: function(cfg) {
            var title = titleTpl.apply(cfg);
            this.getParent().setTitle(title);
            Ext.fly(this.getParent().tabEl).child(
                'span.x-tab-strip-text', true).qtip = title;
        }
    };
}();

Ext.ns('Ext.iG.Cronk.ColumnRenderer');
/**
 * @class Ext.iG.Cronk.ColumnRenderer
 * @singleton
 */
Ext.iG.Cronk.ColumnRenderer = function() {
    var g,
        s,
        c,
        task;
    var Preview = function(e, el) {
        var row = g.getView().findRowIndex(el);
        if(row !== false) {
            var rec = s.getAt(row);
            Ext.iG.Cronk.Window({
                title: new Ext.XTemplate(c.title).apply(rec.data),
                host: rec.get(c.host),
                service: rec.get(c.service),
                start: c.preview.start ?
                       Math.ceil(strtotime(c.preview.start)) : '',
                height: c.preview.height,
                width: c.preview.width,
                overview: c.preview.overview
            });
        }
    };
    var Popup = function(e, el) {
        var row = g.getView().findRowIndex(el);
        if(row !== false) {
            var rec = s.getAt(row);
            Ext.iG.Cronk.Popup({
                title: new Ext.XTemplate(c.title).apply(rec.data),
                host: rec.get(c.host),
                service: rec.get(c.service),
                start: c.popup.start ?
                       Math.ceil(strtotime(c.popup.start)) : '',
                height: c.popup.height,
                width: c.popup.width,
                target: e.getTarget()
            });
        }
    };
    var onLoad = function() {
        var iGColumns = g.el.select('div.iGColumn');
        iGColumns.each(function(column) {
            column.on({
                mouseover: function(e, el) {
                    if(!task) {
                        task = new Ext.util.DelayedTask(Popup);
                    }
                    task.delay(c.popup.timeout, null, null, [e, el]);
                },
                mouseout: function() {
                    if(task) {
                        task.cancel();
                        task = null;
                    }
                },
                click: Preview
            });
        });
    };
    return {
        init: function(grid, cfg) {
            g = grid;
            s = g.getStore();
            c = cfg;
            s.on({
                load : onLoad
            });
        }
    };
}();
