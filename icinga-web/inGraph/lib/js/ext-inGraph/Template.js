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
    
    write: function() {
        var params = {
            series: []
        }
        var map = this.fields.map;
        this.each(function(rec) {
            var o = {};
            Ext.iterate(rec.data, function(k, v) {
                if((f = map[k]) && f.isFlotOption) {
                    o[f.name] = v;
                }
            });
            params.series.push(o);
        });
        Ext.Ajax.request({
             url: Ext.iG.Urls.templates.edit,
             params: Ext.encode(params),
             scope: this,
             success: function() { console.log(arguments);},
             failure: function() { console.log(arguments);}
        });
    }
});