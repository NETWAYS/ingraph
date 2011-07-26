Ext.ns('Ext.iG');

Ext.iG.FlotJsonStore = Ext.extend(Ext.data.JsonStore, {

    keepModifications : true,
    
    refreshInterval : 300,

    constructor : function(cfg) {
        Ext.applyIf(cfg, {
            autoDestroy : true,
            root : 'results',
            fields : [
                {name : 'data', defaultValue : []},
                {name : 'label', defaultValue : ''},
                {name : 'unit', defaultValue : ''},
                {name : 'color', defaultValue : null},
                {name : 'xaxis', defaultValue : 1},
                {name : 'yaxis', defaultValue : 1},
                {name : 'id', defaultValue : undefined},
                {name : 'fillBetween', defaultValue: undefined},
                {name : 'lines', defaultValue : {}},
                {name : 'points', defaultValue : {}},
                {name : 'bars', defaultValue : {}},
                {name : 'shadowSize', defaultValue : 3},
                {name : 'stack', defaultValue: undefined},
                {name : 'disabled', defaultValue : false},
                {name : 'key', defaultValue : undefined}
            ],
            autoLoad : true,
            idProperty : 'key'
        });

        Ext.iG.FlotJsonStore.superclass.constructor.call(this, Ext.apply(cfg, {
            reader : new Ext.iG.FlotJsonReader(cfg)
        }));

        if(this.keepModifications) {
            this.on({
                load : function(store) {
                    Ext.each(store.getModifiedRecords(), function(mr) {
                        var r = store.getById(mr.id) || store.getAt(store.find('label', mr.get('label')));
                        if(r) {
                            Ext.iterate(mr.getChanges(), function(k, v) {
                            	if(k != 'data') {
                                    r.set(k, v);
                            	}
                            });
                        }
                    });
                },
                scope : this
            });
        }
    }

});

(function() {

	var _constructor = Ext.iG.FlotJsonStore.prototype.constructor;

	Ext.override(Ext.iG.FlotJsonStore, {
		
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