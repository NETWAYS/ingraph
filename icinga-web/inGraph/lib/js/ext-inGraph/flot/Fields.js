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
        var group = rec.host;
        if(rec.service) {
            group += ' - ' + rec.service;
        }
        group += ' - ' + rec.plot;
        return group;
    };
    var labelConverter = function(v, rec) {
        return v ? v : rec.plot + '-' + rec.type;
    };
    var reConverter = function(v, rec) {
        return '/^' + rec.plot + '$/';
    };
    var template = [{
        name: 're',
        isTemplateOption: true,
        convert: reConverter
    }, {
        name: 'host',
        isViewOption: true
    }, {
        name: 'service',
        isViewOption: true
    }, {
        name: 'plot'
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
        defaultValue: undefined,
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
    }, {
        name: 'lines',
        defaultValue: {},
        isFlotOption: true
    }, {
        name: 'points',
        defaultValue: {},
        isFlotOption: true
    }, {
        name: 'bars',
        defaultValue: {},
        isFlotOption: true
    }, {
        name: 'stack',
        defaultValue: false,
        isFlotOption: true
    }, {
        name: 'convert'
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
