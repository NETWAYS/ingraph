Ext.ns('Ext.iG');
Ext.iG.FlotJsonStore = Ext.extend(Ext.data.JsonStore, {
    keepModifications: true,
    startProperty: 'start',
    endProperty: 'end',
    optionsProperty: 'options',
    mintimestampProperty: 'minTimestamp',
    maxtimestampProperty: 'maxTimestamp',

    constructor: function(cfg) {
        Ext.applyIf(cfg, {
            autoDestroy : true,
            root: 'results',
            fields: [{name: 'data', defaultValue: []},
                     {name: 'label', defaultValue: ''},
                     {name: 'unit', defaultValue: ''},
                     {name: 'color', defaultValue: null},
                     {name: 'xaxis', defaultValue: 1},
                     {name: 'yaxis', defaultValue: undefined},
                     {name: 'id', defaultValue: undefined},
                     {name: 'fillBetween', defaultValue: undefined},
                     {name: 'lines', defaultValue: {}},
                     {name: 'points', defaultValue: {}},
                     {name: 'bars', defaultValu : {}},
                     {name: 'shadowSize', defaultValue: 3},
                     {name: 'stack', defaultValue: undefined},
                     {name: 'enabled', defaultValue: false},
                     {name: 'key', defaultValue: undefined}],
            autoLoad: true,
            idProperty: 'key'
        });
        Ext.iG.FlotJsonStore.superclass.constructor.call(this, cfg);
        this.addEvents('beforeautorefresh');
        if(Ext.isNumber(this.refreshInterval)) {
            this.on({
                scope: this,
                single: true,
                load: function() {
                    this.startRefresh();
                },
            });
        }
        if(this.keepModifications) {
            this.on({
                datachanged: function(store) {
                    Ext.each(store.getModifiedRecords(), function(mr) {
                        var r = store.getById(mr.id) ||
                                store.getAt(
                                    store.find('label', mr.get('label')));
                        if(r) {
                            Ext.iterate(mr.getChanges(), function(k, v) {
                            	if(k != 'data') {
                                    r.set(k, v);
                            	}
                            });
                        }
                    });
                },
                scope: this
            });
        }
    },
    
    autorefresh: function() {
        if(this.fireEvent('beforeautorefresh') !== false) {
            this.reload();
        }
    },
    
    startRefresh: function(ms) {
    	if(ms !== undefined && ms !== this.refreshInterval) {
    		this.refreshInterval = ms;
    	}
        this.stopRefresh();
        this.refreshId = setInterval(this.autorefresh.createDelegate(this, []),
            this.refreshInterval*1000);
        /*
         * TODO(el): Call startRefresh if this.refreshId on every load?
         */
    },
    
    stopRefresh: function() {
        if(this.refreshId) {
            clearInterval(this.refreshId);
        }
    },
    
    getStart: function() {
    	return this.reader.jsonData[this.startProperty];
    },
    
    getEnd: function() {
        return this.reader.jsonData[this.endProperty];
    },
    
    getMintimestamp: function() {
    	return this.reader.jsonData[this.mintimestampProperty];
    },
    
    getMaxtimestamp: function() {
        return this.reader.jsonData[this.maxtimestampProperty];
    },
    
    getOptions: function() {
    	return this.reader.jsonData[this.optionsProperty];
    }
});