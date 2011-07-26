(function() {
	var _format = String.format;
	
	String.format = function(format) {
		Ext.each(Ext.toArray(arguments, 1), function(arg) {
			if(typeof arg == 'object') {
				for(var key in arg) {
			        format = format.replace(new RegExp('\\{(' + key + ')\\}', 'gi'), function() {
			            return arg[key];
			        });
				}
			}
		});
		
		return _format.apply(this, arguments);
	};
})();