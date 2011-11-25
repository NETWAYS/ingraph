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
               {'name': 'enabled', defaultValue: true},
               'adv'
            ],
            data: {
               frames: [
                   {'name': _('One Hour'), start: '-1 hour', enabled: false,
                    adv: _('hourly')},
                   {'name': _('Four Hours'), start: '-4 hours',
                    overview: true, adv: _('four-hourly')},
                   {'name': _('One Day'), start: '-1 day',
                    adv: _('daily')},
                   {'name': _('One Week'), start: '-1 week',
                    adv: _('weekly')},
                   {'name': _('One Month'), start: '-1 month',
                    adv: _('monthly')},
                   {'name': _('One Year'), start: '-1 year',
                    adv: _('yearly')}
                ]
            },
            listeners: {
                scope: this,
                load: function() {
                    this.each(function(rec) {
                        rec.set('interval', strtotime(rec.get('end')) -
                                            strtotime(rec.get('start')));
                    });
                }
            }
        });
        Ext.iG.TimeFrames.superclass.constructor.call(this, cfg);
    }
});
