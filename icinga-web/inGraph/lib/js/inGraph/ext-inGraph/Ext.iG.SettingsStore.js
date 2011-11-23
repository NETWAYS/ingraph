Ext.ns('Ext.iG');
/**
 * @class Ext.iG.SettingsStore
 * @extends Ext.data.Store
 */
Ext.iG.SettingsStore = Ext.extend(Ext.data.Store, {
    constructor: function(template) {
        cfg = {
            idProperty: 'key',
            root: 'series',
            fields: ['host',
                     'service',
                     'plot',
                     'type',
                     'color',
                     're',
                     'key'],
            //url: 'http://localhost/standalone/modules/ingraph/provider/template',
            //autoLoad: true,
            data: template,
            baseParams: {
                host: 'localhost',
                service: 'PING'
            },
            listeners: {
                scope: this,
                load: function() {
                    console.log("load", arguments);
                },
                exception: function() {
                    console.log("exc", arguments);
                }
            }
        };
        console.log(cfg);
        cfg.reader = new Ext.iG.FlotJsonReader(cfg);
        Ext.iG.SettingsStore.superclass.constructor.call(this, cfg);
    }
});
