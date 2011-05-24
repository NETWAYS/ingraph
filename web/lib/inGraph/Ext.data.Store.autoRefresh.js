(function() {

var _constructor = Ext.data.Store.prototype.constructor;

Ext.override(Ext.data.Store, {
	
	refreshInterval : false,
	
	constructor : function(cfg) {
		_constructor.call(this, cfg);
		
		this.addEvents(
		    'beforeautorefresh',
		    'autorefresh'
		);
		
		this.refreshInterval = typeof cfg.refreshInterval !== 'undefined' ? cfg.refreshInterval : this.refreshInterval;
		
		if(Ext.isNumber(this.refreshInterval)) {
			this.on({
				load : function() {
					this.startRefresh();
				},
				scope : this,
				single : true
			});
		}
	},
	
	refresh : function() {
		if(this.fireEvent('beforeautorefresh') !== false) {
			lastOptions = this.lastOptions;
			this.reload(Ext.apply(lastOptions.options, {
				callback : function() {
					this.fireEvent('autorefresh');
				}
			}));
		}
	},
	
	setRefresh : function(ms, start) {
		start = start || false;
		if(ms != this.refreshInterval) {
			this.refreshInterval = ms;
		}
		if(start) {
			this.startRefresh();
		}
	},
	
	startRefresh : function(ms) {
		this.stopRefresh();
		this.refreshId = setInterval(this.refresh.createDelegate(this, []), ms || this.refreshInterval*1000);
	},
	
	stopRefresh : function() {
		if(this.refreshId) {
			clearInterval(this.refreshId);
		}
	}
	
}); 

})();