Ext.ns('Ext.iG');
/**
 * @class Ext.iG.AddPlot
 * @extends Ext.Window
 */
Ext.iG.AddPlot = Ext.extend(Ext.Window, {
    title: _('Settings'),
    layout: 'fit',
    collapsible: true,
    modal: true,
    bodyStyle: 'padding: 5px;',
    width: 280,
    height: 180,
    
    initComponent: function() {
        var cfg = {};
        this.buildItems(cfg);
        Ext.apply(this, Ext.apply(this.initialConfig, cfg));
        Ext.iG.AddPlot.superclass.initComponent.call(this);
        this.addEvents('beforecancel', 'addplot');
    },
    
    buildItems: function(cfg) {
        cfg.items = [{
            xtype: 'form',
            ref: 'form',
            monitorValid: true,
            defaults: {
                xtype: 'igcombo',
                width: 180,
                allowBlank: false
            },
            baseCls: 'x-plain',
            labelWidth: 55,
            items: [{
                name: 'host',
                ref: '../hostCmp',
                fieldLabel: _('Host'),
                emptyText: _('Choose Host'),
                store: {
                    url: Ext.iG.Urls.provider.hosts
                },
                plugins: [new Ext.ux.ComboController(
                              {control: [{scope: this, cmp: 'serviceCmp'},
                                         {scope: this, cmp: 'plotCmp'}]})]
            }, {
                name: 'service',
                ref: '../serviceCmp',
                fieldLabel: _('Service'),
                emptyText: _('Choose Service'),
                disabled: true,
                store: {
                    url: Ext.iG.Urls.provider.services
                },
                plugins: [new Ext.ux.ComboDependency(
                              {depends: {scope: this, param: 'host',
                                         cmp: 'hostCmp'}})]
            }, {
                name: 'plot',
                ref: '../plotCmp',
                fieldLabel: _('Plot'),
                emptyText: _('Choose Plot'),
                disabled: true,
                store: {
                    xtype: 'jsonstore',
                    root: 'plots',
                    fields: ['plot', 'service'],
                    idProperty: 'plot',
                    paramNames: {
                        start: 'offset'
                    },
                    baseParams: {
                        offset: 0,
                        limit: Ext.iG.AutoComboBox.pageSize // TODO(el): Valid?
                    },
                    url: Ext.iG.Urls.provider.plots
                },
                plugins: [new Ext.ux.ComboDependency(
                              {depends: [{scope: this, param: 'host',
                                          cmp: 'hostCmp'},
                                         {scope: this, param: 'service',
                                          cmp: 'serviceCmp'}]}),
                          new Ext.ux.ComboController(
                              {control: {scope: this, cmp: 'typeCmp'}})]
            }, {
                xtype: 'combo',
                name: 'type',
                ref: '../typeCmp',
                fieldLabel: _('Types'),
                emptyText: _('Choose Type'),
                disabled: true,
                store: ['avg', 'min', 'max', 'lower_limit', 'upper_limit',
                        'warn_lower', 'warn_upper', 'crit_lower', 'crit_upper']
            }],
            buttons: [{
                text: _('Add'),
                iconCls: 'ingraph-icon-accept',
                formBind: true,
                scope: this,
                handler: this.doAdd
            }, {
                text: _('Cancel'),
                iconCls: 'ingraph-icon-cancel',
                scope: this,
                handler: this.doCancel
            }]
        }];
    },
    
    doAdd: function() {
        this.fireEvent('addplot', this, this.form.getForm().getValues());
    },
    
    doCancel: function() {
        if(this.fireEvent('beforecancel', this) !== false) {
            this[this.closeAction]();
        }
    }
});