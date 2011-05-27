Ext.ux.ComboDependency = Ext.extend(Object, {
	
	constructor : function(cfg) {
		Ext.apply(this, cfg);
	},
	
	init : function(combo) {
		if(!Ext.isArray(this.depends)) {
			this.depends = new Array(this.depends);
		}
		
		combo.getStore().on({
			beforeload  : function(self, options) {
				Ext.each(this.depends, function(dep) {
					Ext.iterate(dep, function(param, id) {
						id = this.formatId(id);
						options.params[param] = Ext.getCmp(id).getValue();
					}, this);					
				}, this);
				
				return true;
            },
			scope : this
		});
	}
	
});

Ext.apply(Ext.ux.ComboDependency.prototype, Ext.ux.idInterface.prototype);