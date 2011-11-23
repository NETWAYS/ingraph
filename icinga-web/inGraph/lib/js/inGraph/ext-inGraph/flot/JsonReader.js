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