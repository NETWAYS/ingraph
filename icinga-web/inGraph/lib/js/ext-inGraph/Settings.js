Ext.ns('Ext.iG.Settings');
/**
 * @class Ext.iG.Settings
 * @extends Ext.Window
 */
         var logger = function() {
            console.log(this, arguments);
        };
//{[this.functionName(values.valueName)]}
Ext.iG.Settings = Ext.extend(Ext.Window, {
    title: _('Settings'),
    layout: 'fit',
    width: 350,
    height: 250,
    collapsible: true,
    modal: true,
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        this.buildButtons(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.Settings.superclass.initComponent.call(this);
    },
    
    initEvents: function() {
        this.addEvents('applysettings', 'savesettings');
        Ext.iG.Settings.superclass.initEvents.call(this);
    },
    
    buildItems: function(cfg) {
        var editor = new Ext.ux.grid.RowEditor({
            saveText: 'Update'
        });
        cfg.items = [{
            xtype: 'grid',
            view: new Ext.grid.GroupingView({
                forceFit: true,
                groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]}) {[Ext.iG.Settings.logger(this, values)]}',
                showGroupName: false
            }),
            plugins: [editor],
            store: this.store,
            cm: new Ext.grid.ColumnModel({
                defaults: {
                    sortable: true
                },
                columns: [{
                    xtype: 'booleancolumn',
                    header: _('Enabled'),
                    dataIndex: 'enabled',
                    align: 'center',
                    width: 50,
                    trueText: _('Yes'),
                    falseText: _('No'),
                    editor: {
                        xtype: 'checkbox'
                    }
                }, {
                    header: _('Group'),
                    dataIndex: 'group',
                    hidden: true
                }, {
                    header: _('Label'),
                    dataIndex: 'label',
                    editor: {
                        xtype: 'textfield'
                    }
                }, {
                    header: _('Type'),
                    dataIndex: 'type',
                    align: 'center',
                    width: 100
                }, {
                    header: _('Color'),
                    dataIndex: 'color',
                    xtype: 'templatecolumn',
                    tpl: new Ext.XTemplate(
                        '<tpl if="values.color">',
                            '<span style="background:{color}; float:left;' +
                                          'display: block; height: 10px;' +
                                          'line-height: 10px; width: 10px;' +
                                          'border: 1px solid #666;"' +
                                   'unselectable="on">&#160;</span>' +
                            '<span style="padding:2px;">{color}</span>' +
                        '</tpl>',
                        {compiled: true}),
                    editor: {
                        xtype: 'colorfield',
                        lazyInit: false
                    }
                }]
            }),
            bbar: [{
                text: _('Add Plot'),
                iconCls: 'ingraph-icon-add',
                scope: this,
                handler: this.doAddPlot
            }, {
                text: _('Edit Plot'),
                disabled: true,
                iconCls: 'icinga-icon-cog',
                scope: this,
                handler: this.doEditPlot
            }]
        }];
    },
    
    buildButtons: function(cfg) {
        cfg.buttons = [{
            text: _('Save'),
            iconCls: 'ingraph-icon-save',
            scope: this,
            handler: this.doSave
        }, {
            text: _('Apply'),
            iconCls: 'ingraph-icon-accept',
            scope: this,
            handler: this.doApply
        }, {
            text: _('Cancel'),
            iconCls: 'ingraph-icon-cancel',
            scope: this,
            handler: this.doCancel
        }];
    },
    
    doSave: function() {
        this.store.write();
    },
    
    doApply: function() {
        console.log(this.store.getRange(), Ext.pluck(this.store.data.items, 'data'));
        this.fireEvent('applysettings', this);
    },
    
    doCancel: function() {
        this[this.closeAction]()
    },
//    constructor: function(store) {
//        var items = [{
//            ref: 'series',
//            width: 610,
//            height: 160,
//            title: _('Series'),
//            xtype: 'editorgrid',
//            clicksToEdit: 1,
//            plugins: [new Ext.ux.grid.CheckColumn()],
//            store: new Ext.iG.Template(store),
//            cm: new Ext.grid.ColumnModel({
//                defaults: {
//                    sortable: true
//                },
//                columns: [{
//                    header: _('Label'),
//                    dataIndex: 'label',
//                    editor: new Ext.form.TextField()
//                }, {
//                    header: _('Plot'),
//                    dataIndex: 'ds'
//                }, {
//                    header: _('Thresholds'),
//                    xtype: 'checkcolumn',
//                    dataIndex: '__thresholds',
//                    width: 70
//                }, {
//                    header: _('Limits'),
//                    xtype: 'checkcolumn',
//                    dataIndex: '__limits',
//                    width: 40
//                }, {
//                    header: _('Smoke'),
//                    xtype: 'checkcolumn',
//                    dataIndex: '__smoke',
//                    width: 50
//                }, {
//                    header: _('Color'),
//                    dataIndex: 'color',
//                    editor: new Ext.ux.ColorField()
//                }]
//            }),
//            listeners: {
//                scope: this,
//                cellmousedown: function(grid, row, column, e) {
//                    var field = grid.getColumnModel().getDataIndex(column),
//                        store = grid.getStore(),
//                        rec = store.getAt(row),
//                        checked = !rec.get(field);
//                    switch(field) {
//                        case '__thresholds':
//                            var t = new Ext.data.Record({
//                                host: rec.get('host'),
//                                service: rec.get('service'),
//                                plot: rec.get('plot'),
//                                type: ['warn_lower', 'warn_upper',
//                                       'crit_lower', 'crit_upper']
//                            });
//                            this.series.store.add(t);
//                            break;
//                        case '__limits':
//                            var prefix = rec.id.slice(0, -3),
//                                min = store.getById(prefix + 'min'),
//                                max = store.getById(prefix + 'max');
//                            min.set('enabled', checked);
//                            max.set('enabled', checked);
//                            break;
//                        case '__smoke':
//                            break;
//                    }
//                }
//            },
//            buttonAlign: 'left',
//            buttons: [{
//                text: _('Add Plot'),
//                iconCls: 'ingraph-icon-add',
//                scope: this,
//                handler: this.addPlot
//            }]
//        }];
//        cfg.items = items;
//        cfg.buttons = [{
//            text: _('Save'),
//            iconCls: 'ingraph-icon-save',
//            scope: this
//        }, {
//            text: _('Apply'),
//            iconCls: 'ingraph-icon-accept',
//            scope: this
//        }, {
//            text: _('Cancel'),
//            iconCls: 'ingraph-icon-cancel',
//            scope: this
//        }];
//        Ext.iG.Settings.superclass.constructor.call(this, cfg);
//    },
    
    doAddPlot: function() {
        if(this.addPlotWindow === undefined) {
            this.addPlotWindow = new Ext.iG.AddPlot({
                closeAction: 'hide',
                listeners: {
                    scope: this,
                    beforecancel: function(win) {
                        win.form.getForm().reset();
                    },
                    addplot: function(win, spec) {
                        console.log("addplot", spec);
                        var data = {
                            series: [spec]
                        };
                        // TODO(el): Do NOT override.
                        this.store.loadData(data, true);
                        win.doCancel();
                    }
                }
            });
        }
        this.addPlotWindow.show();
    }
});
Ext.iG.Settings.logger = function() {
    console.log(this, arguments);
};
