/*
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

/*global Ext */

(function () {
    'use strict';
    Ext.override(Ext.ux.flot.SeriesConfiguration, {
        addPlotHandler: function () {
            /*
             * Show window to add plot series after clicking the add plot button
             * of the series configuration component.
             */
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
