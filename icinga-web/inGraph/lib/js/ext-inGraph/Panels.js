Ext.ns('Ext.iG');
/**
 * @class Ext.iG.Panels
 * @extends Ext.data.JsonStore
 */
Ext.iG.Panels = Ext.extend(Ext.data.JsonStore, {
    constructor: function(cfg) {
        Ext.applyIf(cfg, {
            fields: [{name: 'title', defaultValue: _('No Title')},
                     {name: 'titleFormat',
                      defaultValue: _('{title} graph for {host} {service}')},
                     'start',
                     {name: 'end', defaultValue: 'now'},
                     {name: 'overview', defaultValue: false}]
        });
        Ext.iG.Panels.superclass.constructor.call(this, cfg);
    }
});
