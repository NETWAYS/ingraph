/*
 * Thanks to Condor for this code, http://www.sencha.com/forum/showthread.php?53009-Adding-removing-fields-and-columns
 */
Ext.override(Ext.data.Store, {
	addField : function(field) {
		field = new Ext.data.Field(field);
		
		this.recordType.prototype.fields.replace(field);
		
		if(typeof field.defaultValue != 'undefined') {
			this.each(function(r) {
				if(typeof r.data[field.name] == 'undefined') {
					r.data[field.name] = field.defaultValue;
				}
			});
		}
		
		this._buildExtractors();
	},
	
	removeField : function(name) {
		this.recordType.prototype.fields.removeKey(name);
		
		this.each(function(r) {
			delete r.data[name];
			if(r.modified) {
				delete r.modified[name];
			}
		});
		
		this._buildExtractors();
	},
	
	_buildExtractors : function() {
		delete this.reader.ef;
		this.reader.buildExtractors();
	}
	
});
