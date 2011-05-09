Ext.ux.ComboDependency = Ext.extend(Object, {
	
	idFormat : 'iG-{0}',
	
	constructor : function(cfg) {
		Ext.apply(this, cfg);
	},
	
	init : function(combo) {
		var deps = this.depends,
			idFormat = this.idFormat;
		if(!Ext.isArray(deps)) {
			deps = new Array(deps);
		}
		
		combo.getStore().on({
			beforeload  : function(self, options) {
				Ext.each(deps, function(dep) {
					Ext.iterate(dep, function(param, id) {
						id = idFormat.format(id.ucfirst());
						options.params[param] = Ext.getCmp(id).getValue();
					});					
				});
				
				return true;
            },
			scope : combo
		});
	}
	
});