(function() {

var _constructor = Ext.data.Store.prototype.constructor;

Ext.override(Ext.data.Store, {
	
	constructor : function(cfg) {
		_constructor.call(this, cfg);
		
		this.on({
			exception : function(proxy, type, action, options, response, arg) {
				Ext.ux.Toast.msg(
					_('Error'),
					_('<p>{0} {1} {2} (<i>{3}</i>)</p><p><b>{4}</b></p>'),
					action, type, _('failed'), proxy.url, arg
				);
			},
			scope : this
		})
	}
	
}); 

})();