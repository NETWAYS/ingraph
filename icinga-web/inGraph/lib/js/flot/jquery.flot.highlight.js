/*!
 * jquery.flot.highlight.js
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 * jquery.flot.highlight.js may be freely distributed under the MIT license.
 */

/**
 * (Un)highlights series by modifying `lines.lineWidth` on `plothover` if
 * `lines.highlight` is set to `true`.
 */
; (function () {
    'use strict';
    var $ = this.jQuery,
        markedSeries = {};
    function highlight($item) {
        markedSeries[$item.seriesIndex] = {
            lineWidth: $item.series.lines.lineWidth
        };
        $item.series.lines.lineWidth += 2;
    }
    function restore($data) {
        $.each(markedSeries, function (i, $series) {
            $data[i].lines.lineWidth = $series.lineWidth;
        });
        markedSeries = {};
    }
    function highlightHandler(e, pos, $item) {
        var dirty = $.isEmptyObject(markedSeries);
        restore(this.getData());
        if ($item) {
            highlight($item)
            this.draw();
        } else if (dirty) {
            this.draw();
        }
    }
    function init($plot) {
        $plot.hooks.processOptions.push(function () {
            if ($plot.getOptions().series.lines.highlight) {
                var handler = $.proxy(highlightHandler, $plot);
                $plot.hooks.bindEvents.push(function () {
                    $plot.getPlaceholder().bind('plothover', handler);

                });
                $plot.hooks.shutdown.push(function () {
                    $plot.getPlaceholder().unbind('plothover', handler);
                });
            }
        });
    }
    $.plot.plugins.push({
        init: init,
        options: {
            series: {
                lines: {
                    highlight: true
                }
            }
        },
        name: 'highlight',
        version: '1.0'
    });
}.call(this));
