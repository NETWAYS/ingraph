/**
 * jquery.flot.sort
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * jquery.flot.sort is licensed under the terms of the
 *             GNU Open Source GPL 3.0
 * license.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function ($) {
    "use strict";

    var options = {};

    var init = function (plot) {
        var series,
            i = 1,
            seriesSorted = false,

            sortByLabel = function (plot) {
                if (series === undefined) {
                    series = plot.getData();
                }
                if (i > 1 && i === series.length) {
                    series.sort(function (a, b) {
                        return a.label === b.label ? 0 :
                                (a.label < b.label ? -1 : 1);
                    });
                }
                ++i;
            },

            sortByMean = function (plot) {
                if (series === undefined) {
                    series = plot.getData();
                }
                if (seriesSorted === false) {
                    // Sort series by their mean from highest to lowest.
                    // This is nice for filled lines since series will not paint
                    // over each other.
                    series.sort(function (b, a) {
                        return $.map(a.data, function (v) {
                            return parseFloat(v[1]);
                        }).mean() - $.map(b.data, function (v) {
                            return parseFloat(v[1]);
                        }).mean();
                    });
                    seriesSorted = true;
                }
            };

        plot.hooks.processRawData.push(sortByLabel);
        plot.hooks.drawSeries.push(sortByMean);
    };

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'sort',
        version: '1.0'
    });
}(jQuery));