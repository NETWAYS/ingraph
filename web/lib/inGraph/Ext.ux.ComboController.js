Ext.ux.ComboController = Ext.extend(Object, {
	
	idFormat : 'iG-{0}',
	
	constructor : function(cfg) {
		Ext.apply(this, cfg);
	},
	
	init : function(combo) {
		var obs = this.observe,
			idFormat = this.idFormat;
		if(!Ext.isArray(obs)) {
			obs = new Array(obs);
		}
		
		combo.on({
			select  : function() {				
				Ext.each(obs, function(id) {
					id = idFormat.format(id.ucfirst());
	                Ext.getCmp(id).enable();
	                Ext.getCmp(id).clearValue();					
				}); 
            },
            change  : function(self, value) {
				Ext.each(obs, function(id) {
					id = idFormat.format(id.ucfirst());
					
	                Ext.getCmp(id).clearValue();
	                
	                if(value) {
	                    Ext.getCmp(id).enable();
	                } else {
	                	Ext.getCmp(id).disable();
	                }	                
	                
				});
            },
			scope : combo
		});
	}
	
});