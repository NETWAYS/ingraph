/* Flot plugin for creating gauge charts.

 Copyright (c) 2014 NETWAYS GmbH
 Licensed under the MIT license.

 * Created by Alexander Fuhr <alexander.fuhr@netways.de>

 The plugin supports these options:

    var options = {
        show: true,
        range: [0, 100],
        background: '#FFFFFF',
        needle: {
            color: 'black',
            lineWidth: 3
        },
        ranges: [
            {
                background: '#30aa4f',
                range: [0, 25]
            },
            {
                background: '#f4f900',
                range: [25, 75]
            },
            {
                background: '#ed0c20',
                range: [75, 100]
            }
        ]
    };

 Example API usage:

    $.plot($("#placeholder"), [[75]], options);
*/

(function ($) {

    "use strict";

    function init(plot) {

        var canvas = null;
        var processed = false;
        var ctx = null;
        var options = null;

        plot.hooks.processOptions.push(function (plot, options) {
            if (options.series.gauge.show) {
                options.grid.show = false;
                options.grid.clickable = false;
                options.grid.hoverable = false;
            }
        });

        plot.hooks.processDatapoints.push(function (plot) {
            options = plot.getOptions();
            options = options.series.gauge;
            if (options.show) {
                if (!processed) {
                    processed = true;
                    canvas = plot.getCanvas();
                }
            }
        });

        plot.hooks.draw.push(function (plot, newCtx) {
            // TODO(el): NEVER EVER USE GLOBAL VARIABLES!
            var options = plot.getOptions();
            options = options.series.gauge;
            if (options.show) {
                draw(plot, newCtx);
            }
        });

        function angleCord(angle) {
            return  angle * Math.PI / 180;
        }

        function drawRanges(radius) {
            var margin = options.range[1] - options.range[0];
            for (var i = 0; i < options.ranges.length; ++i) {
                var x = options.ranges[i].range[0];
                var y = options.ranges[i].range[1];

                if (options.range[0] < 0) {
                    x -= options.range[0];
                    y -= options.range[0];
                }

                if (options.range[0] > 0) {
                    x += options.range[0];
                    y += options.range[0];
                }

                var from = (180 / margin * x) + 180;
                var to = (180 / margin * y) + 180;

                ctx.beginPath();
                ctx.arc(radius, radius, radius, angleCord(to), angleCord(from), true);
                ctx.lineTo(radius, radius);
                ctx.closePath();
                ctx.fillStyle = options.ranges[i].color;
                ctx.fill();
            }
        }

        function drawTicks() {

            var canvasHeight = plot.getPlaceholder().height();

            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(canvasHeight, canvasHeight, canvasHeight / 1.69, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(canvasHeight, canvasHeight, canvasHeight / 1.71, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(canvasHeight, canvasHeight);

            var divisor = 0.0;
            var pPoints = [];

            do {
                ctx.beginPath();
                ctx.moveTo(canvasHeight, canvasHeight);
                var angle = 180 * divisor;
                var px = canvasHeight - (canvasHeight * 0.59) * Math.cos(angleCord(angle));
                var py = canvasHeight - (canvasHeight * 0.59) * Math.sin(angleCord(angle));

                var pxL = canvasHeight - (canvasHeight * 0.42) * Math.cos(angleCord(angle));
                var pyL = canvasHeight - (canvasHeight * 0.42) * Math.sin(angleCord(angle));

                ctx.lineTo(px, py);
                ctx.stroke();

                var value = (options.range[1] - options.range[0]) * divisor + options.range[0];

                pPoints.push({px: pxL, py: pyL, value: value.toFixed(0)});

                divisor += 0.25;

            } while (divisor <= 1);

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(canvasHeight, canvasHeight, canvasHeight / 1.9, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();

            ctx.font = '12px Arial';
            ctx.fillStyle = '#333333';

            for (var i in pPoints) {
                var textWidth = ctx.measureText(pPoints[i].value).width;
                ctx.fillText(pPoints[i].value, (pPoints[i].px - textWidth / 2), pPoints[i].py - 5);
            }
        }

        function draw(plot, newCtx) {



            var canvasHeight = plot.getPlaceholder().height();

            ctx = newCtx;

            var data = plot.getData();

            var value = data[0].data[0][1];

            var d1 = value - options.range[0];
            var d2 = options.range[1] - options.range[0];
            var percent = d1 / d2;

            ctx.fillStyle = options.background;
            ctx.beginPath();
            ctx.arc(canvasHeight, canvasHeight, canvasHeight, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();

            drawRanges(canvasHeight);

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(canvasHeight, canvasHeight, canvasHeight / 1.7, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();

            drawTicks();

            ctx.save();

            ctx.lineWidth = options.needle.lineWidth;
            ctx.strokeStyle = options.needle.color;
            ctx.beginPath();
            ctx.moveTo(canvasHeight, canvasHeight);

            var angle = 180 * percent;
            var px = canvasHeight - (canvasHeight * 0.80) * Math.cos(angleCord(angle));
            var py = canvasHeight - (canvasHeight * 0.80) * Math.sin(angleCord(angle));

            ctx.shadowColor = 'rgba(0,0,0,0.75)';
            ctx.shadowOffsetX = 8;
            ctx.shadowOffsetY = 8;
            ctx.shadowBlur = 10;
            ctx.lineTo(px, py);
            ctx.stroke();

            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;

            ctx.fillStyle = 'black';
            ctx.font = '26px Arial';
            var textWidth = ctx.measureText(value.toFixed(0)).width;
            ctx.fillText(value.toFixed(0), (canvasHeight - textWidth / 2), canvasHeight * 0.80);

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(canvasHeight, canvasHeight, canvasHeight * 0.1, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    var options = {
        series: {
            gauge: {
                show: false,
                range: [0, 100],
                background: '#FFFFFF',
                needle: {
                    color: 'black',
                    lineWidth: 3
                },
                ranges: [
                    {
                        color: '#30aa4f',
                        range: [0, 50]
                    },
                    {
                        color: '#f4f900',
                        range: [50, 75]
                    },
                    {
                        color: '#ed0c20',
                        range: [75, 100]
                    }
                ]
            }
        }
    };

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'gauge',
        version: "0.1"
    });

})(jQuery);
