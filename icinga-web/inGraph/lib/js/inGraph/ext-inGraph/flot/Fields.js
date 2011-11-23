Ext.ns('Ext.iG.flot');
/**
 * @class Ext.iG.flot.Fields
 * @extends Object
 * @singleton
 */
Ext.iG.flot.Fields = function() {
    var keyConverter = function(v, rec) {
        return rec.host + rec.service + rec.plot + rec.type;
    };
    var groupConverter = function(v, rec) {
        return rec.host + ' - ' + rec.service + ' - ' + rec.plot;
    };
    var labelConverter = function(v, rec) {
        return v ? v : rec.plot + '-' + rec.type;
    };
    var template = [{
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
        name: 'unit',
        isFlotOption: true
    }, {
        name: 'color',
        isFlotOption: true,
        defaultValue: null
    }, {
        name: 'enabled',
        defaultValue: true,
        isFlotOption: true
    }, {
        name: 'yaxis',
        defaultValue: undefined,
        isFlotOption: true
    }];
    var dataConverter = function(v, rec) {
        Ext.each(v, function(xy) {
            xy[0] *= 1000;
        });
        return v;
    };
    var series = [].concat(template);
    series.push({
        name: 'data',
        defaultValue: [],
        convert: dataConverter
    });
    return {
        template: template,
        series: series
    };
}();