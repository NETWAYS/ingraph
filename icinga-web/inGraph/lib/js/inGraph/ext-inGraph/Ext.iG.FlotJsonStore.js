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
 * @extends Ext.data.Store
 */
Ext.iG.FlotJsonStore = Ext.extend(Ext.data.Store, {
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
        cfg.reader = new Ext.iG.FlotJsonReader(cfg);
        Ext.iG.FlotJsonStore.superclass.constructor.call(this, cfg);
        
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
        return this.baseParams.start !== undefined ?
               this.baseParams.start :
               this.getMintimestamp();
    },
    
    getEnd: function() {
        if(this.lastOptions.params !== undefined) {
            if(this.lastOptions.params.end !== undefined) {
                return this.lastOptions.params.end;
            }
        }
        return this.baseParams.end !== undefined ?
               this.baseParams.end :
               this.getMaxtimestamp();
    },
    
    getQuery: function() {
        if(this.lastOptions.query !== undefined) {
            return this.lastOptions.query;
        }
        return this.baseParams.query;
    },
    
    getMintimestamp: function() {
        return this.reader.jsonData[this.mintimestampProperty];
    },
    
    getMaxtimestamp: function() {
        return this.reader.jsonData[this.maxtimestampProperty];
    },
    
    getOptions: function() {
        return this.reader.jsonData[this.optionsProperty];
    },
    
    getComments: function() {
        return this.reader.jsonData.comments;
    },
    
    getHostsAndServices: function(hosts, services) {
        this.each(function(rec) {
            if(rec.get('enabled') !== true) {
                return;
            }
            var host = rec.get('host'),
                service = rec.get('service');
            if(hosts.indexOf(host) === -1) {
                hosts.push(host);
            }
            if(services.indexOf(service) === -1) {
                services.push(service);
            }
        });
    },
    
    isEmpty: function() {
        if(this.reader.jsonData.charts.length === 0) {
            return true;
        }
        var empty = Ext.each(this.reader.jsonData.charts, function(chart) {
            if(chart.data.length === 0) {
                return false;
            }
        });
        return empty !== undefined ? true : false;
    }
});
