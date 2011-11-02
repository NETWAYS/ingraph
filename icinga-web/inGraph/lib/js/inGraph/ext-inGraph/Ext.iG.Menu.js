Ext.ns('Ext.iG');
Ext.iG.Menu = Ext.extend(Ext.Panel, {
    constructor: function(cfg) {
        this.hostCmp = new Ext.ux.AutoComboBox({
            name: 'host',
            url: cfg.provider.hosts,
            plugins: [new Ext.ux.ComboController(
                {control: {scope: this, cmp: 'serviceCmp'}})],
            emptyText: _('Choose Host')
        });
        this.serviceCmp = new Ext.ux.AutoComboBox({
            name: 'service',
            url: cfg.provider.services,
            plugins: [new Ext.ux.ComboDependency(
                {depends: {scope: this, param: 'host',
                           cmp: 'hostCmp'}})],
            disabled: true,
            emptyText: _('Choose Service')
        });
        this.viewCmp = new Ext.ux.AutoComboBox({
            name: 'view',
            url: cfg.provider.views,
            emptyText: _('Choose View'),
            storeCfg: {
                fields: ['view', 'config']
            },
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
        this.timeFrames = new Ext.iG.TimeFrames();
        var dispGraphBtn = new Ext.SplitButton({
            text: _('Display Graph'),
            width: 80,
            cls: 'x-btn-text-left',
            handler: function(self, e) {
                this.fireEvent('plot', self, {
                    host: this.hostCmp.getValue(),
                    service: this.serviceCmp.getValue(),
                    start: this.startCmp.getValue(),
                    end: this.endCmp.getValue()
                }, this.timeFrames);
            },
            scope: this,
            menu: {
                ignoreParentClicks: true,
                items: [{
                    xtype: 'menutextitem',
                    text: _('Choose frames to plot'),
                    style: {
                        'border': '1px solid #999999',
                        'background-color': '#D6E3F2',
                        'margin': '0px 0px 1px 0px',
                        'display': 'block',
                        'padding': '3px',
                        'font-weight': 'bold',
                        'font-size': '12px',
                        'text-align': 'center'
                    }
                }, new Ext.form.CheckboxGroup({
                    fireChecked: function(item, checked) {
                        this.fireEvent('change', this, item, checked);
                    },
                    columns: 1,
                    items: (function(scope) {
                        items = [];
                        scope.timeFrames.each(function(rec) {
                            items.push({
                                boxLabel: rec.get('name'),
                                name: rec.get('name'),
                                checked: rec.get('enabled')
                            });
                        });
                        return items;
                    })(this),
                    listeners: {
                        change: function(bg, item, checked) {
                            rec = this.timeFrames.getById(item.name);
                            rec.set('enabled', checked);
                        },
                        scope: this
                    }
                })]
            }
        });
        var dispViewBtn = new Ext.Button({
            text: _('Display View'),
            width: 80,
            cls: 'x-btn-text-left',
            scope: this,
            handler: function(self, e) {
                this.fireEvent('plot', self, {
                    viewConfig: this.viewCmp.store.getById(
                                    this.viewCmp.getValue()).get('config')
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
        this.addEvents(
           'plot'
        );
        Ext.iG.Menu.superclass.initComponent.call(this);
    }
});
