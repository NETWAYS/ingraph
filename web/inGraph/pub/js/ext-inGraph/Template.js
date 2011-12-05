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
    },
    
    toHash: function(view) {
        var params = {
            series: []
        }
        var map = this.fields.map;
        this.each(function(rec) {
            var o = {};
            Ext.iterate(rec.data, function(k, v) {
                if(view) {
                    if((f = map[k]) && f.isFlotOption || f.isTemplateOption || f.isViewOption) {
                        o[f.name] = v;
                    }
                } else {
                    if((f = map[k]) && f.isFlotOption || f.isTemplateOption) {
                        o[f.name] = v;
                    }
                }
            });
            params.series.push(o);
        });
        return params;
    }
});