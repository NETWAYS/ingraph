Ext.ns('Ext.iG');

Ext.iG.FlotJsonReader = Ext.extend(Ext.data.JsonReader, {
	
	buildExtractors: function() {
		if(this.meta.additionalFields) {
			Ext.each(this.meta.additionalFields, function(field) {
			});
		}
		
		Ext.iG.FlotJsonReader.superclass.buildExtractors.apply(this, arguments);
	}

});