Ext.ns('Ext.iG');
Ext.iG.AutoComboBox = Ext.extend(Ext.ux.AutoComboBox, {
    minChars: 0,
    height: 30,
    pageSize: 20,
    width: 240,
    triggerAction: 'all',
    hideTrigger: true,
    listEmptyText: _('No results...'),
    editable: true,
    
    constructor: function(cfg) {
        cfg.name = cfg.name.toLowerCase();
        
        Ext.applyIf(cfg, {
            tpl: String.format('<tpl for="."><div ext:qtip="{{0}}" class="x-combo-list-item">{{0}}</div></tpl>', cfg.name),
            id: Ext.id(null, 'ext-ig-'),
            hiddenName: cfg.name,
            fieldLabel: cfg.name.ucfirst(),
            queryParam: cfg.name,
            valueField: cfg.name,
            displayField: cfg.name
        });
        
        if(!Ext.isArray(cfg.store)) {
            Ext.applyIf(cfg.store, {
                xtype: 'arraystore',
                autoDestroy: true,
                root: 'results',
                fields: [cfg.name],
                paramNames: {
                    start: 'offset'
                },
                baseParams: {
                    offset: 0,
                    limit: cfg.pageSize || this.pageSize
                },
                idProperty: cfg.name
            });
        }
        
        Ext.iG.AutoComboBox.superclass.constructor.call(this, cfg);
    }
});
Ext.reg('igcombo', Ext.iG.AutoComboBox);