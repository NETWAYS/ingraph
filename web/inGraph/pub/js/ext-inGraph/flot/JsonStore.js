/**
 * @class Ext.iG.FlotJsonStore
 * @extends Ext.data.Store
 */
Ext.iG.FlotJsonStore = Ext.extend(Ext.data.Store, {
    keepModifications: true,
    mintimestampProperty: 'min_timestamp',
    maxtimestampProperty: 'max_timestamp',
    commentsProperty: 'comments',

    constructor: function(cfg) {
        Ext.applyIf(cfg, {
            autoDestroy : true,
            root: 'charts',
            fields: Ext.iG.flot.Fields.series,
            autoLoad: true,
            idProperty: 'key',
            listeners: {
                scope: this,
                beforeload: this.onBeforeLoad
            }
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
    
    destroy: function() {
        this.stopRefresh();
        Ext.iG.FlotJsonStore.superclass.destroy.call(this);
    },
    
    getStart: function() {
        return this.lastStart || this.getMintimestamp();
    },
    
    getEnd: function() {
        return this.lastEnd || this.getMaxtimestamp();
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
    
    getComments: function() {
        return this.reader.jsonData[this.commentsProperty];
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
    },
    
    onBeforeLoad: function(self, options) {
        if(options.params.start === undefined &&
           Ext.isString(self.baseParams.start)) {
            options.params.start = Math.ceil(strtotime(self.baseParams.start));
        } else if(Ext.isString(options.params.start)) {
            options.params.start = Math.ceil(strtotime(options.params.start));
        }
        
        if(options.params.end === undefined &&
           Ext.isString(self.baseParams.end)) {
            options.params.end = Math.ceil(strtotime(self.baseParams.end));
        } else if(Ext.isString(options.params.end)) {
            options.params.end = Math.ceil(strtotime(options.params.end));
        }
        
        this.lastStart = options.params.start || self.baseParams.start;
        this.lastEnd = options.params.end || self.baseParams.end;
    }
});