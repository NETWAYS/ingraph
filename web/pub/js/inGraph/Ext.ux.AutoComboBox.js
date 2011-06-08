Ext.ux.AutoComboBox = Ext.extend(Ext.form.ComboBox, {
	
	minChars : 0,
	
	height : 30,
	
	pageSize : 20,
	
	width : 240,
	
	constructor : function(cfg) {
		cfg = cfg || {};
		cfg.storeCfg = cfg.storeCfg || {};
		cfg.name = cfg.name.toLowerCase();
		
		Ext.applyIf(cfg, {
            triggerAction : 'all',
            hideTrigger : true,
            listEmptyText : _('No results...'),
            editable : true,
            tpl : '<tpl for="."><div ext:qtip="{{0}}" class="x-combo-list-item">{{0}}</div></tpl>'.format(cfg.name),
            id : this.formatId(cfg.name),
            hiddenName : cfg.name,
            fieldLabel : cfg.name.ucfirst(),
            queryParam : cfg.name,
            valueField : cfg.name,
            displayField : cfg.name
		});
		
		Ext.applyIf(cfg.storeCfg, {
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
            },
            idProperty : cfg.name
		});
		
		cfg.store = new Ext.data.JsonStore(cfg.storeCfg);
		delete cfg.storeCfg;
		
		Ext.ux.AutoComboBox.superclass.constructor.call(this, cfg);
		
		this.store.on({
			beforeload : function(store, options) {
				var value = options.params[this.valueField] || store.baseParams[this.valueField];
				
				if(value) {
					if(value.charAt(0) != '%') {
						value = '%' + value;
					}
					if(value.charAt(value.length-1) != '%') {
						value += '%';
					}
					store.setBaseParam(this.valueField, value);
				} else {
					store.setBaseParam(this.valueField, '%');
				}
			},
			scope : this
		});
	},
	
	onRender : function() {
		Ext.ux.AutoComboBox.superclass.onRender.apply(this, arguments);
		
		this.el.on({
			click : function() {
				this.selectText();
				this.getStore().reload();
			},
			scope : this
		});
	}
	
});

Ext.reg('autocombo', Ext.ux.AutoComboBox);
Ext.apply(Ext.ux.AutoComboBox.prototype, Ext.ux.idInterface.prototype);