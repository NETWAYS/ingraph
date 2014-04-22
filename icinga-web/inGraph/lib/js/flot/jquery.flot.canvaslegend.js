/*!
 * jquery.flot.canvaslegend.js
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 * jquery.flot.canvaslegend.js may be freely distributed under the MIT license.
 */

; (function () {
    'use strict';
    var $ = this.jQuery,
        $options;
    /**
     * Draws the legend on the canvas. Mirros the look of the vanilla one.
     * The HTML-driven version will be removed from the DOM. Does not apply
     * if a custom `legend.container` is set. Supports semi off-plot placement
     * with the `legend.offPlot` setting which may be one of `top`, `right`,
     * `bottom` and `left`. The original canvas size will be increased by
     * the width or height of the legend based on its position. Does not respect
     * `legend.noColumns`.
     */
    function replaceLegend($plot, ctx) {
        /*!
         * TODO(el): Respect legend.noColumns.
         */
        if ($options.legend.container) {
            /*!
             * TODO(el): Off-plot placement of the legend with a container.
             */
            return;
        }
        var $placeholder = $plot.getPlaceholder(),
            $legend = $options.legend.container || $placeholder.find('.legend'),
            $legendHtml = $legend.html();
        if (!$legendHtml) {
            // Either no data or no labels
            return;
        }
        var $labelFormatter = $options.legend.labelFormatter,
            legendPosition = {
                x: 0,
                y: 0
            };
        ctx.save();
        ctx.font = $placeholder.css('font-style') + ' ' +
            $placeholder.css('font-variant') + ' ' +
            $placeholder.css('font-weight') + ' ' +
            $placeholder.css('font-size') + ' ' +
            $placeholder.css('font-family');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        if ($options.legend.offPlot) {
            var $legendWidth = 0,
                $legendHeight = 0;
            $.each($plot.getData(), function (i, $series) {
                if (!$series.label) {
                    // Continue
                    return;
                }
                $legendHeight += 18; // 18 is the height of a legend label line
                $legendWidth = Math.max(
                    $legendWidth,
                    ctx.measureText($labelFormatter ?
                            $labelFormatter($series.label, $series) :
                            $series.label
                        ).width
                );
            });
            $legendWidth += 22 + $options.legend.margin; // 22 is the width of a legend label color box
            var $plotWidth = $placeholder.width() || $plot.width(),
                $plotHeight = $placeholder.height() || $plot.height(),
                newWidth = $plotWidth +
                    $legendWidth,
                newHeight = $plotHeight +
                    $legendHeight,
                plotPosition = {
                    x: 0,
                    y: 0
                },
                c = document.createElement('canvas'),
                oldCtx = ctx;
            c.width = newWidth;
            c.height = newHeight;
            // Initial style of canvas is undefined with jsdom and node-canvas
            c.style = c.style || {};
            c.style.width = newWidth + 'px';
            c.style.height = newHeight + 'px';
            switch ($options.legend.offPlot.toLowerCase()) {
            case 'top':
                plotPosition.y = $legendHeight;
                break;
            case 'right':
                legendPosition.x = $plotWidth;
                break;
            case 'bottom':
                legendPosition.y = $plotHeight;
                break;
            case 'left':
                plotPosition.x = $legendWidth;
                break;
            default:
                throw new Error("Unexpected value '" + $options.legend.offPlot +
                    "' for `legend.offPlot`. Expected is one of `top`, " +
                    "`right`, `bottom` and `left`"
                    );
            }
            ctx = c.getContext('2d');
            ctx.save();
            ctx.font = oldCtx.font;
            ctx.textAlign = oldCtx.textAlign;
            ctx.textBaseline = oldCtx.textBaseline;
            ctx.drawImage($plot.getCanvas(), plotPosition.x, plotPosition.y);
            $($plot.getCanvas()).replaceWith(c);
            $plot.getCanvas = function () {
                return c;
            };
        } else { // default
            /*!
             * Offsets do not work with Node.js and jsdom since it does not
             * implement http://www.w3.org/TR/cssom-view/.
             * Thus `legendPosition = $legend.position();` unfortunately
             * doesn't work. Instead of copying flot's positioning code here
             * we abuse the style tag.
             */
            legendPosition = (function () {
                var top = $legendHtml.match(/top: (\d+)px;/),
                    right = $legendHtml.match(/right: (\d+)px;/),
                    bottom = $legendHtml.match(/bottom: (\d+)px;/),
                    left = $legendHtml.match(/left: (\d+)px;/),
                    x,
                    y;
                if (null === left) {
                    x = $plot.width() - parseInt(right[1], 10);
                } else {
                    x = parseInt(left[1], 10);
                }
                if (null === top) {
                    y = $plot.height() - parseInt(bottom[1], 10);
                } else {
                    y = parseInt(top[1], 10);
                }
                return {
                    x: x,
                    y: y
                };
            }());
        }
        /*!
         * TODO(el):
         * if ($options.legend.backgroundOpacity > 0
         *     && $options.legend.backgroundOpacity < 1
         * ) {
         *     ctx.globalAlpha = $options.legend.backgroundOpacity;
         *     ctx.fillStyle = $options.legend.backgroundColor;
         *     ctx.fillRect(x, y, legendWidth, legendHeight);
         * }
         */
        $.each($plot.getData(), function (i, $series) {
            if (!$series.label) {
                // continue
                return true;
            }
            // Draw 18x14 rectangle filled with the label box's border color
            ctx.fillStyle = $options.legend.labelBoxBorderColor;
            ctx.fillRect(legendPosition.x, legendPosition.y, 18, 14);
            // Draw 16x12 white filled rectangle on top of the latter,
            // i.e. leave a border with a width of one
            ctx.fillStyle = '#FFF';
            ctx.fillRect(legendPosition.x + 1, legendPosition.y + 1, 16, 12);
            // Draw 14x10 series color filled rectangle on top of the latter,
            // i.e. leave again a border with a width of one
            ctx.fillStyle = $series.color;
            ctx.fillRect(legendPosition.x + 2, legendPosition.y + 2, 14, 10);
            ctx.fillStyle = $options.grid.color;
            ctx.fillText(
                $labelFormatter ? $labelFormatter($series.label, $series) :
                        $series.label,
                legendPosition.x + 22,
                legendPosition.y
            );
            legendPosition.y += 18;
        });
        ctx.restore();
        $legend.remove();
    }
    function init($plot) {
        $options = $plot.getOptions();
        if ($options.legend.show) {
            $plot.hooks.draw.push(replaceLegend);
        }
    }
    $.plot.plugins.push({
        init: init,
        options: {
            legend: {
                offPlot: false
            }
        },
        name: 'canvaslegend',
        version: '1.0'
    });
}.call(this));
