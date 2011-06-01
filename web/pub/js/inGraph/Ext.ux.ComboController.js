Ext.ux.ComboController = Ext.extend(Object, {
	
	constructor : function(cfg) {
		Ext.apply(this, cfg);
	},
	
	init : function(combo) {
		if(!Ext.isArray(this.observe)) {
			this.observe = new Array(this.observe);
		}
		
		combo.on({
			select  : function() {				
				Ext.each(this.observe, function(id) {
					id = this.formatId(id);
	                Ext.getCmp(id).enable();
	                Ext.getCmp(id).clearValue();					
				}, this); 
            },
            change  : function(self, value) {
				Ext.each(this.observe, function(id) {
					id = this.formatId(id);
					
	                Ext.getCmp(id).clearValue();
	                
	                if(value) {
	                    Ext.getCmp(id).enable();
	                } else {
	                	Ext.getCmp(id).disable();
	                }	                
	                
				}, this);
            },
			scope : this
		});
	}
	
});

Ext.apply(Ext.ux.ComboController.prototype, Ext.ux.idInterface.prototype);