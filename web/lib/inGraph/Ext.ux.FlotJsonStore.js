Ext.ux.FlotJsonStore = Ext.extend(Ext.data.JsonStore, {
	
	constructor: function(cfg) {
		Ext.applyIf(cfg, {
	        autoDestroy : true,
	        root        : 'series',
	        fields      : ['data',
	                       'label',
	                       'unit',
	                       {name: 'color', defaultValue: null},
	                       {name: 'series', defaultValue: []},
	                       {name: 'xaxis', defaultValue: 1},
	                       {name: 'yaxis', defaultValue: 1},
	                       {name: 'disabled', defaultValue: false}
	        ],
	        autoLoad    : true			
		});
		
		Ext.ux.FlotJsonStore.superclass.constructor.call(this, Ext.apply(cfg, {
            reader		: new Ext.ux.FlotJsonReader(cfg)
        }));
	}

});