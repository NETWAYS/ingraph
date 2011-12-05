Ext.ns('Ext.iG');
Ext.iG.Menu = Ext.extend(Ext.Panel, {
    dateHelp: _('Either select date via the popup date picker or input an ' + 
                'English textual date or time, i.e.<br />' +
                '<ul style="list-style-type:circle;' +
                '    list-style-position:inside;">' +
                    '<li>now</li>' +
                    '<li>last month</li>' +
                    '<li>last mon(day)</li>' +
                    '<li>last year 6 months</li>' +
                    '<li>-6 hours 30 minutes 10 secs</li>' +
                    '<li>-1 month + 10 days</li>' +
                    '<li>3 October 2005</li>' +
                '</ul>'),

    constructor: function(cfg) {
        cfg = cfg || {};
        this.hostCmp = new Ext.iG.AutoComboBox({
            name: 'host',
            fieldLabel: _('Host'),
            emptyText: _('Choose host'),
            store: {
                url: Ext.iG.Urls.provider.hosts
            },
            plugins: [new Ext.ux.ComboController(
                {control: [{scope: this, cmp: 'serviceCmp'},
                           {scope: this, cmp: 'dispGraphBtn'}]})]
        });
        this.serviceCmp = new Ext.iG.AutoComboBox({
            name: 'service',
            fieldLabel: _('Service'),
            emptyText: _('Choose service'),
            store: {
                url: Ext.iG.Urls.provider.services
            },
            plugins: [new Ext.ux.ComboDependency(
                {depends: {scope: this, param: 'host',
                           cmp: 'hostCmp'}})],
            disabled: true,
            qtip: _('Leave this field empty if you want display the host ' + 
                    'graph'),
            listeners: {
                render: function(combo) {
                    new Ext.ToolTip({
                        dismissDelay: 0,
                        target: combo.el,
                        html: combo.qtip
                    });
                }
            }
        });
        this.viewCmp = new Ext.iG.AutoComboBox({
            name: 'view',
            fieldLabel: _('View'),
            emptyText: _('Choose view'),
            width: 490,
            store: {
                url: Ext.iG.Urls.provider.views
            },
            plugins: [new Ext.ux.ComboController(
                {control: {scope: this, cmp: 'dispViewBtn'}})]
        });
        this.startCmp = new Ext.form.DateField({
            format: 'Y-m-d H:i:s',
            fieldLabel: _('Start'),
            emptyText: _('Starttime'),
            width: 150,
            listeners: {
                scope: this,
                render: function(f) {
                    new Ext.ToolTip({
                        dismissDelay: 0,
                        target: f.el,
                        html: this.dateHelp
                    });
                }
            }
        });
        this.endCmp = new Ext.form.DateField({
            format: 'Y-m-d H:i:s',
            fieldLabel: _('End'),
            emptyText: _('Endtime'),
            width: 150,
            listeners: {
                scope: this,
                render: function(f) {
                    new Ext.ToolTip({
                        dismissDelay: 0,
                        target: f.el,
                        html: this.dateHelp
                    });
                }
            }
        });
        this.dispGraphBtn = new Ext.Button({
            text: _('Display Graph'),
            width: 80,
            cls: 'x-btn-text-left',
            disabled: true,
            scope: this,
            handler: function(self, e) {
                this.fireEvent('plot', self, {
                    host: this.hostCmp.getValue(),
                    service: this.serviceCmp.getValue(),
                    start: this.startCmp.strValue || this.startCmp.getValue() ? this.startCmp.getValue().getTime()/1000 : null,
                    end: this.endCmp.strValue || this.endCmp.getValue() ? this.endCmp.getValue().getTime()/1000 : null
                });
            }
        });
        this.dispViewBtn = new Ext.Button({
            text: _('Display View'),
            width: 80,
            cls: 'x-btn-text-left',
            disabled: true,
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
            bodyStyle: 'padding:5px;',
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
                    items: this.dispGraphBtn
                }, {
                    items: this.startCmp
                }, {
                    items: this.endCmp
                }, {
                    items: {
                        xtype: 'container',
                        autoEl: {
                            tag: 'div',
                            cls: 'ingraph-logo',
                            style: 'height: 65px; width: 190px'
                        }
                    },
                    rowspan: 2
                }, {
                    items: this.viewCmp,
                    colspan: 2
                }, {
                    items: this.dispViewBtn
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
