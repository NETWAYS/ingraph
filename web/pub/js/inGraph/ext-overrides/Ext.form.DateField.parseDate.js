(function() {

var _parseDate = Ext.form.DateField.prototype.parseDate;

Ext.override(Ext.form.DateField, {
	
	parseDate : function(value) {
		var d = _parseDate.call(this, value);
		if(!d) {
			var t = strtotime(value);

			if(t != false) {
				t = Math.ceil(t*1000);
				return new Date(t);
			}
			
			return "";
		}
		
		return d;
	}
	
}); 

})();