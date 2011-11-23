Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Template
 * @extends Ext.data.GroupingStore
 */
Ext.iG.Template = Ext.extend(Ext.data.GroupingStore, {
    constructor: function(data) {
        cfg = {
            idProperty: 'key',
            root: 'series',
            groupField: 'group',
            fields: Ext.iG.Template.Config.fields
        };
        cfg.reader = new Ext.iG.FlotJsonReader(cfg);
        if(data) {
            cfg.data = data;
        }
        Ext.iG.Template.superclass.constructor.call(this, cfg);
    }
});

Ext.iG.Template.Config = function() {
    var keyConverter = function(v, rec) {
        return rec.host + rec.service + rec.plot + rec.type;
    };
    var groupConverter = function(v, rec) {
        return rec.host + ' - ' + rec.service + ' - ' + rec.plot;
    };
    var labelConverter = function(v, rec) {
        return v ? v : rec.plot + '-' + rec.type;
    };
    var fields = [{
        name: 'host',
        isTemplateOption: true
    }, {
        name: 'service',
        isTemplateOption: true
    }, {
        name: 'plot',
        isTemplateOption: true
    }, {
        name: 'type',
        isTemplateOption: true
    }, {
        name: 'key',
        convert: keyConverter
    }, {
        name: 'group',
        convert: groupConverter
    }, {
        name: 'label',
        convert: labelConverter,
        isFlotOption: true
    }, {
        name: 'color',
        isFlotOption: true,
        defaultValue: null
    }, {
        name: 'enabled',
        defaultValue: true,
        isFlotOption: true
    }];
    return {
        fields: fields
    };
}();
