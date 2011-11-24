Ext.ns('Ext.iG');
Ext.iG.Menu = Ext.extend(Ext.Panel, {
    constructor: function(cfg) {
        cfg = cfg || {};
        this.hostCmp = new Ext.iG.AutoComboBox({
            name: 'host',
            store: {
                url: Ext.iG.Urls.provider.hosts
            },
            plugins: [new Ext.ux.ComboController(
                {control: {scope: this, cmp: 'serviceCmp'}})],
            emptyText: _('Choose Host')
        });
        this.serviceCmp = new Ext.iG.AutoComboBox({
            name: 'service',
            store: {
                url: Ext.iG.Urls.provider.services
            },
            plugins: [new Ext.ux.ComboDependency(
                {depends: {scope: this, param: 'host',
                           cmp: 'hostCmp'}})],
            disabled: true,
            emptyText: _('Choose Service')
        });
        this.viewCmp = new Ext.iG.AutoComboBox({
            name: 'view',
            store: {
                url: Ext.iG.Urls.provider.views
            },
            emptyText: _('Choose View'),
            width: 490
        });
        this.startCmp = new Ext.form.DateField({
            format: 'Y-m-d H:i:s',
            fieldLabel: _('Start'),
            width: 150,
            emptyText: _('Starttime')
        });
        this.endCmp = new Ext.form.DateField({
            format: 'Y-m-d H:i:s',
            fieldLabel: _('End'),
            width: 150,
            emptyText: _('Endtime')
        });
        var dispGraphBtn = new Ext.Button({
            text: _('Display Graph'),
            width: 80,
            cls: 'x-btn-text-left',
            handler: function(self, e) {
                this.fireEvent('plot', self, {
                    host: this.hostCmp.getValue(),
                    service: this.serviceCmp.getValue(),
                    start: this.startCmp.getValue(),
                    end: this.endCmp.getValue()
                });
            },
            scope: this
        });
        var dispViewBtn = new Ext.Button({
            text: _('Display View'),
            width: 80,
            cls: 'x-btn-text-left',
            scope: this,
            handler: function(self, e) {
                this.fireEvent('plot', self, {
                    view: this.viewCmp.getValue()
                });
            }
        });
        Ext.apply(cfg, {
            border: true,
            xtype: 'form',
            frame: true,
            bodyStyle: 'padding:5px',
            labelAlign: 'top',
            items: [{
                autoScroll: true,
                layout: 'table',
                layoutConfig: {
                    columns: 6
                },
                defaults: {
                    bodyStyle: 'padding:5px'
                },
                items: [{
                    items: this.hostCmp
                }, {
                    items: this.serviceCmp
                }, {
                    items: dispGraphBtn
                }, {
                    items: this.startCmp
                }, {
                    items: this.endCmp
                }, {
                    items: {
                        xtype: 'box',
                        autoEl: {
                            tag: 'img',
                            src: 'images/ingraph_logo.png'
                        }
                    },
                    rowspan: 2
                }, {
                    items: this.viewCmp,
                    colspan: 2
                }, {
                    items: dispViewBtn
                }]
            }]
        });
        Ext.iG.Menu.superclass.constructor.call(this, cfg);
    },
    
    initComponent: function() {
        Ext.iG.Menu.superclass.initComponent.call(this);
        this.addEvents('plot');
    }
});
