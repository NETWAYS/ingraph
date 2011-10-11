Ext.ns('Ext.iG');
Ext.iG.TimeFrames = Ext.extend(Ext.data.JsonStore, {
	constructor: function(cfg) {
		cfg = cfg || {};
		Ext.applyIf(cfg, {
		    autoDestroy: true,
		    root: 'frames',
		    idProperty: 'name',
		    fields: [
		       'name',
		       'start',
		       {'name': 'end', defaultValue: 'now'},
		       {'name': 'overview', defaultValue: false},
		       {'name': 'enabled', defaultValue: true}
		    ],
		    data: {
		       frames: [
		           {'name': _('One Hour'), start: '-1 hour', enabled: false},
		           {'name': _('Four Hours'), start: '-4 hours'},
		           {'name': _('One Day'), start: '-1 day', overview: true},
		           {'name': _('One Week'), start: '-1 week'},
		           {'name': _('One Month'), start: '-1 month'},
		           {'name': _('One Year'), start: '-1 year'}
		        ]
		    }
		});
		Ext.iG.TimeFrames.superclass.constructor.call(this, cfg);
	}
});
var t = new Ext.iG.TimeFrames();
console.log(t);