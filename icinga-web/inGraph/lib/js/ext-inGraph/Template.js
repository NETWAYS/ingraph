Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Template
 * @extends Ext.data.GroupingStore
 */
Ext.iG.Template = Ext.extend(Ext.data.GroupingStore, {
    constructor: function(cfg) {
        cfg = cfg || {};
        Ext.applyIf(cfg, {
            idProperty: 'key',
            root: 'series',
            groupField: 'group',
            fields: Ext.iG.flot.Fields.template
        });
        cfg.reader = new Ext.iG.FlotJsonReader(cfg);
        Ext.iG.Template.superclass.constructor.call(this, cfg);
    }
});