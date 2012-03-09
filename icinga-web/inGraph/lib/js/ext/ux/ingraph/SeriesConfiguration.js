/*
 * Show window to add plot series after clicking the add plot button of
 * the series configuration component.
 */

(function () {
    "use strict";

    Ext.override(Ext.ux.flot.SeriesConfiguration, {
        addPlotHandler: function () {
            var win = new Ext.ux.ingraph.AddPlotWindow({
                listeners: {
                    scope: this,
                    apply: function (me, spec) {
                        spec.group = String.format('{0} - {1} - {2}', spec.host,
                                                   spec.service, spec.plot);

                        spec.plot_id = String.format('{0} - {1}', spec.group,
                                                     spec.type);

                        spec.re = String.format('/^{0}$/', spec.plot);

                        var data = {
                            series: [spec]
                        };

                        // TODO(el): Do NOT overwrite
                        this.store.loadData(data, true); // true to append
                    }
                }
            });

            win.show();
        }
    });
}());
