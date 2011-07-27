(function() {
	var _format = String.format;
	
	String.format = function(format) {
		var newargs = new Array();
		
		Ext.each(Ext.toArray(arguments, 1), function(arg) {
			if(typeof arg == 'object') {
				for(var key in arg) {
			        format = format.replace(new RegExp('\\{(' + key + ')\\}', 'gi'), function() {
			            return arg[key];
			        });
				}
			} else {
				newargs.push(arg);
			}
		});
		
		newargs.unshift(format);
		
		return _format.apply(this, newargs);
	};
})();