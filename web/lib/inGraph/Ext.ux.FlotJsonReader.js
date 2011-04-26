Ext.ux.FlotJsonReader = Ext.extend(Ext.data.JsonReader, {
	
	buildExtractors: function() {
		if(this.meta.additionalFields) {
			Ext.each(this.meta.additionalFields, function(field) {
			});
		}
		
		Ext.ux.FlotJsonReader.superclass.buildExtractors.apply(this, arguments);
	}

});