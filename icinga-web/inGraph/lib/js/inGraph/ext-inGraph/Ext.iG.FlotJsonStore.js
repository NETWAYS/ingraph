Ext.ns('Ext.iG');
/**
 * @class Ext.iG.FlotJsonReader
 * @extends Ext.data.JsonReader
 */
Ext.iG.FlotJsonReader = Ext.extend(Ext.data.JsonReader, {
    buildExtractors: function() {
        Ext.iG.FlotJsonReader.superclass.buildExtractors.apply(this, arguments);
        this.getId = function(rec) {
             return rec.host + rec.service + rec.plot +
                    rec.type;
        };
    }
});
/**
 * @class Ext.iG.FlotJsonStore
 * @extends Ext.data.JsonStore
 */
Ext.iG.FlotJsonStore = Ext.extend(Ext.data.JsonStore, {
    keepModifications: true,
    mintimestampProperty: 'min_timestamp',
    maxtimestampProperty: 'max_timestamp',

    constructor: function(cfg) {
        Ext.applyIf(cfg, {
            autoDestroy : true,
            root: 'charts',
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
                     {name: 'enabled', defaultValue: true},
                     {name: 'host'},
                     {name: 'service'},
                     {name: 'plot'},
                     {name: 'type'},
                     {name: 'key', convert: function(v, rec) {
                         return rec.host + rec.service + rec.plot +
                                rec.type;}}],
            autoLoad: true,
            idProperty: 'key'
        });
        Ext.iG.FlotJsonStore.superclass.constructor.call(this, cfg);
        this.reader = new Ext.iG.FlotJsonReader(cfg);
        this.addEvents('beforeautorefresh');
        if(Ext.isNumber(this.refreshInterval)) {
            this.on({
                scope: this,
                single: true,
                load: function() {
                    this.startRefresh();
                }
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
        if(this.lastOptions.params !== undefined) {
            if(this.lastOptions.params.start !== undefined) {
                return this.lastOptions.params.start;
            }
        }
        return this.baseParams.start;
    },
    
    getEnd: function() {
        if(this.lastOptions.params !== undefined) {
            if(this.lastOptions.params.end !== undefined) {
                return this.lastOptions.params.end;
            }
        }
        return this.baseParams.end;
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
