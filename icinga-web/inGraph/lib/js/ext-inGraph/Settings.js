Ext.ns('Ext.iG.Settings');
/**
 * @class Ext.iG.Settings
 * @extends Ext.Window
 */
Ext.iG.Settings = Ext.extend(Ext.Panel, {
    layout: 'fit',
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        this.buildButtons(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.Settings.superclass.initComponent.call(this);
        this.addEvents('applysettings');
    },
    
    buildItems: function(cfg) {
        var editor = new Ext.ux.grid.RowEditor({
            saveText: _('Apply')
        });
        cfg.items = [{
            xtype: 'grid',
            ref: 'grid',
            view: new Ext.grid.GroupingView({
                forceFit: true,
                groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})',
                showGroupName: false
            }),
            plugins: [editor],
            store: this.store,
            sm: new Ext.grid.RowSelectionModel({
                listeners: {
                    scope: this,
                    single: true,
                    rowselect: function() {
                        this.editPlotBtn.enable();
                    }
                }
            }),
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
                    xtype: 'colorcolumn',
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
                iconCls: 'ingraph-icon-settings',
                scope: this,
                handler: this.onEditPlot,
                ref: '../../editPlotBtn'
            }]
        }];
    },
    
    buildButtons: function(cfg) {
        cfg.buttons = [{
            text: _('Apply'),
            iconCls: 'ingraph-icon-accept',
            scope: this,
            handler: this.onApply
        }, {
            text: _('Cancel'),
            iconCls: 'ingraph-icon-cancel',
            scope: this,
            handler: this.onCancel
        }];
    },
    
    onApply: function() {
        this.fireEvent('applysettings', this);
    },
    
    onCancel: function() {
        this.fireEvent('cancel', this);
    },
    
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
    },
    
    onEditPlot: function() {
        if(this.editPlotWindow === undefined) {
            this.editPlotWindow = new Ext.Window({
                title: _('Series Options'),
                closeAction: 'hide',
                modal: true,
                width: 400,
                listeners: {
                    scope: this,
                    beforecancel: function(win) {
                        win.form.getForm().reset();
                    }
                },
                items: new Ext.iG.flot.Options({
                    baseCls: 'x-plain',
                    ref: 'options',
                    listeners: {
                        scope: this,
                        updateseriesoptions: function(o) {
                            var s = this.grid.getSelectionModel().getSelected(),
                                h = this.editPlotWindow.options.valuesAsRecordHash(
                                    o.getForm().getFieldValues());
                            Ext.iterate(h, function(k, v) {
                                s.set(k, v);
                            });
                            this.editPlotWindow.hide();
                        },
                        cancel: function() {
                            this.editPlotWindow.hide();
                        }
                    }
                })
            });
        }
        this.editPlotWindow.options.form.setValues(
            this.editPlotWindow.options.recordAsValues(
                this.grid.getSelectionModel().getSelected()));
        this.editPlotWindow.show();
    }
});