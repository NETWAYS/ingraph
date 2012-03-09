/**
 * jquery.flot.highlight
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * jquery.flot.highlight is licensed under the terms of the
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

    function init(plot) {
        var restore = {};

        function highlightSeries(series) {
            var draw = false;

            $.each(series, function (i, s) {
                if (s.index === undefined) {
                    s.index = i;
                }

                if (restore[s.index] === undefined) {
                    restore[s.index] = s.lines.lineWidth;
                    s.lines.lineWidth += 2;
                    draw = true;
                }
            });

            if (draw) {
                plot.draw();
            }
        }

        function unHighlightSeries(series) {
            var draw = false;

            $.each(series, function (i, s) {
                if (s.index === undefined) {
                    s.index = i;
                }

                if (restore[s.index] !== undefined) {
                    s.lines.lineWidth = restore[s.index];
                    delete restore[s.index];
                    draw = true;
                }
            });

            if (draw) {
                plot.draw();
            }
        }

        function highlightHandler(e, pos, item) {
            if (item) {
                unHighlightSeries(plot.getData());
                highlightSeries([$.extend(item.series, {index : item.seriesIndex})]);
            } else {
                unHighlightSeries(plot.getData());
            }
        }

        plot.hooks.bindEvents.push(function (plot) {
            if (!plot.getOptions().series.lines.highlight) {
                return;
            }

            plot.getPlaceholder().bind('plothover', highlightHandler);

        });

        plot.hooks.shutdown.push(function (plot) {
            if (!plot.getOptions().series.lines.highlight) {
                return;
            }

            plot.getPlaceholder().unbind('plothover', highlightHandler);
        });
    }

    var options = {
        series : {
            lines : {
                highlight : true
            }
        }
    };

    $.plot.plugins.push({
        init : init,
        options : options,
        name : 'highlight',
        version : '0.1'
    });

}(jQuery));
