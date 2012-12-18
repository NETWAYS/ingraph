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
    Ext.ns('Ext.ux.flot');
    /**
     * Field definitions for jquery.flot configuration/style objects.
     * @author Eric Lippmann <eric.lippmann@netways.de>
     */
    Ext.ux.flot.Fields = (function () {
        var legendFields = new Ext.util.MixedCollection(true, function (field) {
            return field.name;
        });
        legendFields.addAll([
            {
                name: 'show',
                defaultValue: true
            },
            {
                name: 'noColumns',
                defaultValue: 1
            },
            {
                name: 'labelFormatter',
                defaultValue: null
            },
            {
                name: 'labelBoxBorderColor',
                defaultValue: '#ccc'
            },
            {
                name: 'container',
                defaultValue: null
            },
            {
                name: 'position',
                defaultValue: 'ne'
            },
            {
                name: 'margin',
                defaultValue: 5
            },
            {
                name: 'backgroundColor',
                defaultValue: null
            },
            {
                name: 'backgroundOpacity',
                defaultValue: 0.85
            }
        ]);
        var gridFields = new Ext.util.MixedCollection(true, function (field) {
            return field.name;
        });
        gridFields.addAll([
            {
                name: 'show',
                defaultValue: true
            },
            {
                name: 'aboveData',
                defaultValue: false
            },
            {
                name: 'color',
                defaultValue: '#545454'
            },
            {
                name: 'backgroundColor',
                defaultValue: null
            },
            {
                name: 'borderColor',
                defaultValue: null
            },
            {
                name: 'tickColor',
                defaultValue: null
            },
            {
                name: 'labelMargin',
                defaultValue: 5
            },
            {
                name: 'axisMargin',
                defaultValue: 8
            },
            {
                name: 'borderWidth',
                defaultValue: 2
            },
            {
                name: 'minBorderMargin',
                defaultValue: null
            },
            {
                name: 'markings',
                defaultValue: null
            },
            {
                name: 'markingsColor',
                defaultValue: '#f4f4f4'
            },
            {
                name: 'markingsLineWidth',
                defaultValue: 2
            },
            {
                name: 'clickable',
                defaultValue: true
            },
            {
                name: 'hoverable',
                defaultValue: true
            },
            {
                name: 'autoHighlight',
                defaultValue: true
            },
            {
                name: 'mouseActiveRadius',
                defaultValue: 10
            }
        ]);

        var xaxisFields = new Ext.util.MixedCollection(true, function (field) {
            return field.name;
        });
        xaxisFields.addAll([
            {
                name: 'show',
                defaultValue: true
            },
            {
                name: 'position',
                defaultValue: 'bottom'
            },
            {
                name: 'mode',
                defaultvalue: 'time'
            },
            {
                name: 'color',
                defaultValue: null
            },
            {
                name: 'tickColor',
                defaultValue: null
            },
            {
                name: 'transform',
                defaultValue: null
            },
            {
                name: 'inverseTransform',
                defaultValue: null
            },
            {
                name: 'min',
                defaultValue: null
            },
            {
                name: 'max',
                defaultValue: null
            },
            {
                name: 'autoscaleMargin',
                defaultValue: null
            },
            {
                name: 'ticks',
                defaultValue: null
            },
            {
                name: 'tickFormatter',
                defaultValue: null
            },
            {
                name: 'labelWidth',
                defaultValue: null
            },
            {
                name: 'labelHeight',
                defaultValue: null
            },
            {
                name: 'reserveSpace',
                defaultValue: null
            },
            {
                name: 'tickLength',
                defaultValue: null
            },
            {
                name: 'alignTicksWithAxis',
                defaultValue: null
            },
            {
                name: 'tickDecimals',
                defaultValue: null
            },
            {
                name: 'tickSize',
                defaultValue: null
            },
            {
                name: 'minTickSize',
                defaultValue: null
            },
            {
                name: 'monthNames',
                defaultValue: null
            },
            {
                name: 'timeformat',
                defaultValue: null
            },
            {
                name: 'twelveHourClock',
                defaultValue: false
            },
            {
                name: 'axisLabel',
                defaultValue: null
            },
            {
                name: 'unit',
                defaultValue: null
            }
        ]);

        var yaxisFields = xaxisFields.clone();
        yaxisFields.replace('autoscaleMargin', {
            name: 'autoscaleMargin',
            defaultValue: 0.02
        });
        yaxisFields.replace('position', {
            name: 'position',
            defaultValue: 'left'
        });

        var genericSeriesTemplateFields = new Ext.util.MixedCollection(
            true,
            function (field) {
                return field.name;
            }
        );
        genericSeriesTemplateFields.addAll([
            {
                name: 'lines:show',
                defaultValue: true,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.lines) && rec.lines.show !== undefined) {
                        return rec.lines.show;
                    }
                    return v;
                }
            },
            {
                name: 'lines:lineWidth',
                defaultValue: 1,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.lines) &&
                            rec.lines.lineWidth !== undefined) {
                        return rec.lines.lineWidth;
                    }
                    return v;
                }
            },
            {
                name: 'lines:fill',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.lines) &&
                            rec.lines.fill !== undefined) {
                        return rec.lines.fill;
                    }
                    return v;
                }
            },
            {
                name: 'lines:fillColor',
                defaultValue: null,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.lines) &&
                            rec.lines.fillColor !== undefined) {
                        return rec.lines.fillColor;
                    }
                    return v;
                }
            },
            {
                name: 'lines:steps',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.lines) &&
                            rec.lines.steps !== undefined) {
                        return rec.lines.steps;
                    }
                    return v;
                }
            },
            {
                name: 'lines:spline',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.lines) &&
                            rec.lines.spline !== undefined) {
                        return rec.lines.spline;
                    }
                    return v;
                }
            },
            {
                name: 'points:show',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.points) && rec.points.show !== undefined) {
                        return rec.points.show;
                    }
                    return v;
                }
            },
            {
                name: 'points:radius',
                defaultValue: 3,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.points) &&
                            rec.points.radius !== undefined) {
                        return rec.points.radius;
                    }
                    return v;
                }
            },
            {
                name: 'points:lineWidth',
                defaultValue: 2,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.points) &&
                            rec.points.lineWidth !== undefined) {
                        return rec.points.lineWidth;
                    }
                    return v;
                }
            },
            {
                name: 'points:fill',
                defaultValue: true,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.points) &&
                            rec.points.fill !== undefined) {
                        return rec.points.fill;
                    }
                    return v;
                }
            },
            {
                name: 'points:fillColor',
                defaultValue: '#FFFFFF',
                convert: function (v, rec) {
                    if (Ext.isObject(rec.points) &&
                            rec.points.fillColor !== undefined) {
                        return rec.points.fillColor;
                    }
                    return v;
                }
            },
            {
                name: 'bars:show',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) && rec.bars.show !== undefined) {
                        return rec.bars.show;
                    }
                    return v;
                }
            },
            {
                name: 'bars:lineWidth',
                defaultValue: 2,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) &&
                            rec.bars.lineWidth !== undefined) {
                        return rec.bars.lineWidth;
                    }
                    return v;
                }
            },
            {
                name: 'bars:barWidth',
                defaultValue: 1,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) &&
                            rec.bars.barWidth !== undefined) {
                        return rec.bars.barWidth;
                    }
                    return v;
                }
            },
            {
                name: 'bars:fill',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) &&
                            rec.bars.fill !== undefined) {
                        return rec.bars.fill;
                    }
                    return v;
                }
            },
            {
                name: 'bars:fillColor',
                defaultValue: null,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) &&
                            rec.bars.fillColor !== undefined) {
                        return rec.bars.fillColor;
                    }
                    return v;
                }
            },
            {
                name: 'bars:align',
                defaultValue: 'left',
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) &&
                            rec.bars.align !== undefined) {
                        return rec.bars.align;
                    }
                    return v;
                }
            },
            {
                name: 'bars:horizontal',
                defaultValue: false,
                convert: function (v, rec) {
                    if (Ext.isObject(rec.bars) &&
                            rec.bars.horizontal !== undefined) {
                        return rec.bars.horizontal;
                    }
                    return v;
                }
            },
            {
                name: 'shadowSize',
                defaultValue: 3
            }
        ]);

        var seriesTemplateFields = genericSeriesTemplateFields.clone();
        seriesTemplateFields.addAll([
            {
                name: 'enabled',
                defaultValue: true
            },
            {
                name: 'color',
                defaultValue: null
            },
            {
                name: 'label',
                defaultValue: null
            },
            {
                name: 'unit',
                defaultValue: null
            },
            {
                name: 'xaxis',
                defaultValue: null
            },
            {
                name: 'yaxis',
                defaultValue: null
            },
            {
                name: 'clickable',
                defaultValue: true
            },
            {
                name: 'hoverable',
                defaultValue: true
            },
            {
                name: 'id',
                defaultValue: null
            },
            {
                name: 'group',
                defaultValue: null
            },
            {
                name: 'convert',
                defaultValue: null
            },
            {
                name: 'type',
                defaultValue: null
            },
            {
                name: 'fill',
                defaultValue: null
            },
            {
                name: 'fillColor',
                defaultValue: null
            },
            {
                name: 'fillBetween',
                defaultValue: null
            },
            {
                name: 'stack',
                defaultValue: null
            }
        ]);

        var seriesFields = seriesTemplateFields.clone();
        seriesFields.addAll([
            {
                name: 'data',
                defaultValue: []
            }
        ]);

        // public
        return {
            /**
             * @property {Array} seriesTemplateFields
             */
            seriesTemplateFields: seriesTemplateFields.getRange(),
            /**
             * @property {Function} seriesFields
             */
            seriesFields: function (cfg) {
                cfg = cfg || {};

                var fields = seriesFields.clone();

                Ext.iterate(cfg, function (fieldName, spec) {
                    var originalSpec = fields.get(fieldName);
                    if (!originalSpec) {
                        // Skip if field not found
                        return true;
                    }
                    if (!Ext.isObject(spec)) {
                        spec = {
                            defaultValue: spec
                        };
                    }
                    fields.replace(fieldName, Ext.apply(originalSpec, spec));
                });
                return fields.getRange();
            },
            /**
             * @property {Array} legendFields
             */
            legendFields: legendFields.getRange(),

            /**
             * @property {Array} gridFields
             */
            gridFields: gridFields.getRange(),
            /**
             * @property {Array} yaxisFields
             */
            yaxisFields: yaxisFields.getRange(),
            /**
             * @property {Array} xaxisFields
             */
            xaxisFields: xaxisFields.getRange()
        };
    }());
}());
