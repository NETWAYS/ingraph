Ext.ux.FlotJsonStore = Ext.extend(Ext.data.JsonStore, {

    keepModifications : true,
    
    refreshInterval : 300,

    constructor : function(cfg) {
        Ext.applyIf(cfg, {
            autoDestroy : true,
            root : 'results',
            fields : [{name : 'data', defaultValue : []},
                       {name : 'label', defaultValue : null},
                       {name : 'unit', defaultValue : ''},
                       {name : 'color', defaultValue : null},
                       {name : 'xaxis', defaultValue : 1},
                       {name : 'yaxis', defaultValue : 1},
                       {name : 'id', defaultValue : null},
                       {name : 'fillBetween', defaultValue : null},
                       {name : 'lines', defaultValue : {}},
                       {name : 'points', defaultValue : {}},
                       {name : 'bars', defaultValue : {}},
                       {name : 'shadowSize', defaultValue : 3},
                       {name : 'stack', defaultValue : null},
                       {name : 'disabled', defaultValue : false},
                       {name : 'key'}
            ],
            autoLoad : true,
            idProperty : 'key'
        });

        Ext.ux.FlotJsonStore.superclass.constructor.call(this, Ext.apply(cfg, {
            reader : new Ext.ux.FlotJsonReader(cfg)
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
