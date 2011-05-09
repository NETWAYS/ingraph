Ext.ux.AutoComboBox = Ext.extend(Ext.form.ComboBox, {
	
	idFormat : 'iG-{0}',
	
	minChars : 3,
	
	pageSize : 20,
	
	constructor : function(cfg) {
		cfg.name = cfg.name.toLowerCase();
		
		Ext.applyIf(cfg, {
            width : 240,
            triggerAction : 'all',
            hideTrigger : true,
            listEmptyText : _('No results...'),
            editable : true,
            tpl : '<tpl for="."><div ext:qtip="{{0}}" class="x-combo-list-item">{{0}}</div></tpl>'.format(cfg.name),
            id : this.idFormat.format(cfg.name.ucfirst()),
            hiddenName : cfg.name,
            fieldLabel : cfg.name.ucfirst(),
            queryParam : 'host',
            store : new Ext.data.JsonStore({
                autoDestroy : true,
                url : cfg.url,
                root : 'results',
                fields : [cfg.name],
                totalProperty : 'total',
                paramNames : {
                    start : 'offset'
                },
                baseParams:     {
                    offset : 0,
                    limit : cfg.pageSize || this.pageSize
                }
            }),
            valueField : cfg.name,
            displayField : cfg.name,
            listeners : {
                focus : function() {
                    this.getStore().load();
                }
            }
		});
		
		Ext.ux.AutoComboBox.superclass.constructor.call(this, cfg);
	}
});

Ext.reg('autocombo', Ext.ux.AutoComboBox);