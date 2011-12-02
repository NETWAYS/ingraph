Ext.ux.ComboDependency = Ext.extend(Object, {
	constructor: function(cfg) {
		Ext.apply(this, cfg);
	},
	
	init: function(combo) {
		if(!Ext.isArray(this.depends)) {
			this.depends = new Array(this.depends);
		}
		
		combo.getStore().on({
			beforeload: function(self, options) {
				Ext.each(this.depends, function(cfg) {
					var cmp = cfg.scope[cfg.cmp];
					options.params[cfg.param] = cmp.getValue();
				}, this);
				return true;
            },
			scope: this
		});
	}
});