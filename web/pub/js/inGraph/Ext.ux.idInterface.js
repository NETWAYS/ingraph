Ext.ux.idInterface = Ext.extend(Object, {
	
	idFormat : 'iG-{0}',
	
	formatId : function(id) {
		return this.idFormat.format(id);
	}

});