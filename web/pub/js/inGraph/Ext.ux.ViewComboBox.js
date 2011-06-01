Ext.ux.ViewComboBox = Ext.extend(Object, {
	
	constructor : function(cfg) {
		Ext.apply(this, cfg);
	},
	
	init : function(combo) {
		combo.store.addField('config');
		
		Ext.apply(combo, {
			getViewConfig : function() {
				if(this.value) {
					return this.store.getAt(this.store.find('view', this.value)).get('config');
				}
				return null;
			}
		});
	}
	
});