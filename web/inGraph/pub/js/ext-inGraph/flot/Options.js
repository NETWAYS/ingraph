Ext.ns('Ext.iG.flot');
/**
 * @class Ext.iG.flot.Options
 * @extends Ext.FormPanel
 */
Ext.iG.flot.Options = Ext.extend(Ext.FormPanel, {
    labelWidth: 40,
    defaults: {
        xtype: 'fieldset',
//        autoHeight: true,
//        collapsed: false,
        collapsible: true
    },
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        this.buildButtons(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.flot.Options.superclass.initComponent.call(this);
        this.addEvents('updateseriesoptions', 'cancel');
    },
    
    buildItems: function(cfg) {
        var linesGroup = {
            title: _('Lines'),
            items: [{
                layout: 'column',
                xtype: 'container',
                defaults: {
                    xtype: 'container',
                    columnWidth: .33,
                    layout: 'form'
                },
                items:[{
                    defaults: {
                        xtype: 'checkbox',
                        anchor: '95%'
                    },
                    items: [{
                        fieldLabel: _('Show'),
                        name: 'lines.show',
                    }, {
                        fieldLabel: _('Smooth'),
                        name: 'lines.spline',
                    }]
                }, {
                    defaults: {
                        anchor: '95%',
                        xtype:'checkbox'
                    },
                    items: [{
                        fieldLabel: _('Steps'),
                        name: 'lines.steps',
                    }, {
                        fieldLabel: _('Fill'),
                        name: 'lines.fill',
                    }]
                },{
                    defaults: {
                        anchor: '95%'
                    },
                    items: [{
                        xtype: 'spinnerfield',
                        fieldLabel: _('Width'),
                        minValue: 1,
                        maxValue: 10,
                        name: 'lines.lineWidth'
                    }, {
                        xtype: 'colorfield',
                        lazyInit: false,
                        fieldLabel: _('Color'),
                        name: 'lines.fillColor'
                    }]
                }]
            }]
        };
        var pointsGroup = {
            title: _('Points'),
            items: [{
                layout: 'column',
                xtype: 'container',
                defaults: {
                    xtype: 'container',
                    columnWidth: .33,
                    layout: 'form'
                },
                items:[{
                    defaults: {
                        xtype: 'checkbox',
                        anchor: '95%'
                    },
                    items: [{
                        fieldLabel: _('Show'),
                        name: 'points.show',
                    }, {
                        fieldLabel: _('Fill'),
                        name: 'points.fill',
                    }]
                }, {
                    defaults: {
                        anchor: '95%'
                    },
                    items: [{
                        xtype: 'spinnerfield',
                        fieldLabel: _('Radius'),
                        minValue: 1,
                        maxValue: 10,
                        name: 'points.radius',
                    }, {
                        xtype:'colorfield',
                        lazyInit: false,
                        fieldLabel: _('Color'),
                        name: 'points.fillColor'
                    }]
                },{
                    items: [{
                        xtype: 'spinnerfield',
                        fieldLabel: _('Width'),
                        minValue: 1,
                        maxValue: 10,
                        name: 'points.lineWidth',
                        anchor: '95%'
                    }]
                }]
            }]
        };
        var barsGroup = {
            title: _('Bars'),
            items: [{
                layout: 'column',
                xtype: 'container',
                defaults: {
                    xtype: 'container',
                    columnWidth: .33,
                    layout: 'form'
                },
                items:[{
                    defaults: {
                        anchor: '95%',
                        xtype: 'checkbox'
                    },
                    items: [{
                        fieldLabel: _('Show'),
                        name: 'bars.show'
                    }, {
                        fieldLabel: _('Fill'),
                        name: 'bars.fill'
                    }, {
                        xtype: 'combo',
                        store: ['left', 'center'],
                        fieldLabel: _('Align'),
                        name: 'bars.align'
                    }]
                }, {
                    defaults: {
                        anchor: '95%'
                    },
                    items: [{
                        xtype: 'spinnerfield',
                        fieldLabel: _('Width'),
                        minValue: 1,
                        maxValue: 10,
                        name: 'bars.lineWidth',
                        anchor: '95%'
                    }, {
                        xtype:'colorfield',
                        lazyInit: false,
                        fieldLabel: _('Color'),
                        name: 'bars.fillColor'
                    }, {
                        fieldLabel: _('Hor.'),
                        name: 'bars.horizontal',
                        xtype: 'checkbox'
                    }]
                },{
                    defaults: {
                        anchor: '95%'
                    },
                    items: [{
                        xtype: 'spinnerfield',
                        fieldLabel: _('Width'),
                        minValue: 1,
                        maxValue: 10,
                        name: 'bars.barWidth'
                    }]
                }]
            }]
        };
        cfg.items = [linesGroup, pointsGroup, barsGroup];
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
        this.fireEvent('updateseriesoptions', this);
    },
    
    onCancel: function() {
        this.fireEvent('cancel', this);
    },
    
    recordAsValues: function(rec) {
        var map = rec.fields.map,
            values = {};
        Ext.iterate(rec.data, function(k, v) {
            if((f = map[k]) && f.isFlotOption) {
                if(Ext.isObject(v)) {
                    Ext.iterate(v, function(ck, cv) {
                        values[k + '.' + ck] = cv;
                    });
                } else {
                    values[k] = v;
                }
            }
        });
        return values;
    },
    
    valuesAsRecordHash: function(values) {
        var re = /[\[\.]/,
            h = {},
            parts;
        Ext.iterate(values, function(k, v) {
            if(v === true || v === false || v) {
                parts = k.split(re);
                if(parts.length >= 2) {
                    if(!Ext.isObject(h[parts[0]])) {
                        h[parts[0]] = {};
                    }
                    h[parts[0]][parts[1]] = v;
                } else {
                    h[parts[0]] = v;
                }
            }
        });
        return h;
    }
});