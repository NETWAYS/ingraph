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

/*global _, Ext */

(function () {
    'use strict';
    Ext.ns('Ext.ux.flot');
    /**
     * Form to edit the appearance of a flot series.
     * @author Eric Lippmann <eric.lippmann@netways.de>
     */
    Ext.ux.flot.SeriesStyleForm = Ext.extend(Ext.ux.flot.AbstractStyleForm, {
        colorText: _(''),
        fillColorText: _(''),
        linesShowText: _('Specify whether lines should be shown.'),
        linesSplineText: _('Draw a curve by inserting bogus data.'),
        linesStepsText: _('Enable "steps" to cascade lines.'),
        linesFillText: _('Enable "fill" to produce area charts.'),
        linesWidthText: _('Thickness of the line in pixels.'),
        // private override
        buildItems: function (cfg) {
            var seriesGroup =  {
                    title: _('Series'),
                    defaults: {
                        xtype: 'container',
                        layout: 'hbox',
                        layoutConfig: {
                            align: 'pack',
                            stretch: 'start'
                        }
                    },
                    items: [
                        {
                            defaults: {
                                xtype: 'container',
                                layout: 'form',
                                flex: 1
                            },
                            items: [
                                {
                                    items: [
                                        {
                                            xtype: 'checkbox',
                                            fieldLabel: _('Show'),
                                            name: 'enabled'
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            xtype: 'checkbox',
                                            fieldLabel: _('Stack'),
                                            name: 'stack',
                                            anchor: '95%'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            defaults: {
                                xtype: 'container',
                                layout: 'form',
                                flex: 1
                            },
                            items: [
                                {
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: _('Label'),
                                            name: 'label',
                                            anchor: '95%'
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            xtype: 'xcolorfield',
                                            lazyInit: false,
                                            fieldLabel: _('Color'),
                                            name: 'color',
                                            anchor: '95%'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                linesGroup = {
                    title: _('Lines'),
                    items: [
                        {
                            layout: 'column',
                            xtype: 'container',
                            defaults: {
                                xtype: 'container',
                                columnWidth: 0.33,
                                layout: 'form'
                            },
                            items: [
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        xtype: 'checkbox',
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'lines:show',
                                            fieldLabel: _('Show'),
                                            qtip: this.linesShowText
                                        },
                                        {
                                            name: 'lines:spline',
                                            // Disabled until https://github.com/flot/flot/pull/872 got merged
                                            disabled: true,
                                            fieldLabel: _('Smooth'),
                                            qtip: this.linesSplineText
                                        }
                                    ]
                                },
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        xtype: 'checkbox',
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'lines:steps',
                                            fieldLabel: _('Steps'),
                                            qtip: this.linesStepsText
                                        },
                                        {
                                            name: 'lines:fill',
                                            fieldLabel: _('Fill'),
                                            qtip: this.linesFillText

                                        }
                                    ]
                                },
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'lines:lineWidth',
                                            xtype: 'xflotspinnerfield',
                                            minValue: 0,
                                            maxValue: 100,
                                            fieldLabel: _('Line Width'),
                                            qtip: this.linesWidthText
                                        },
                                        {
                                            name: 'lines:fillColor',
                                            xtype: 'xcolorfield',
                                            lazyInit: false,
                                            fieldLabel: _('Fill Color'),
                                            qtip: this.fillColorText

                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                pointsGroup = {
                    title: _('Points'),
                    items: [
                        {
                            layout: 'column',
                            xtype: 'container',
                            defaults: {
                                xtype: 'container',
                                columnWidth: 0.33,
                                layout: 'form'
                            },
                            items: [
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        xtype: 'checkbox',
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            fieldLabel: _('Show'),
                                            name: 'points:show'
                                        },
                                        {
                                            fieldLabel: _('Fill'),
                                            name: 'points:fill'
                                        }
                                    ]
                                },
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'points:radius',
                                            xtype: 'xflotspinnerfield',
                                            minValue: 0,
                                            maxValue: 100,
                                            fieldLabel: _('Radius')
                                        },
                                        {
                                            xtype: 'xcolorfield',
                                            lazyInit: false,
                                            fieldLabel: _('Fill Color'),
                                            name: 'points:fillColor'
                                        }
                                    ]
                                },
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'points:lineWidth',
                                            xtype: 'xflotspinnerfield',
                                            minValue: 0,
                                            maxValue: 100,
                                            fieldLabel: _('Line Width')
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                barsGroup = {
                    title: _('Bars'),
                    items: [
                        {
                            layout: 'column',
                            xtype: 'container',
                            defaults: {
                                xtype: 'container',
                                columnWidth: 0.33,
                                layout: 'form'
                            },
                            items: [
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        anchor: '95%',
                                        xtype: 'checkbox'
                                    },
                                    items: [
                                        {
                                            name: 'bars:show',
                                            fieldLabel: _('Show')
                                        },
                                        {
                                            name: 'bars:fill',
                                            fieldLabel: _('Fill')
                                        },
                                        {
                                            name: 'bars:align',
                                            xtype: 'xigautocombo',
                                            mode: 'local',
                                            store: ['left', 'center'],
                                            fieldLabel: _('Align')
                                        }
                                    ]
                                },
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'bars:lineWidth',
                                            xtype: 'xflotspinnerfield',
                                            minValue: 0,
                                            maxValue: 100,
                                            fieldLabel: _('Line Width')
                                        },
                                        {
                                            name: 'bars:fillColor',
                                            xtype: 'xcolorfield',
                                            lazyInit: false,
                                            fieldLabel: _('Fill Color')
                                        },
                                        {
                                            name: 'bars:horizontal',
                                            xtype: 'checkbox',
                                            fieldLabel: _('Horizontal')
                                        }
                                    ]
                                },
                                {
                                    labelWidth: 70,
                                    defaults: {
                                        anchor: '95%'
                                    },
                                    items: [
                                        {
                                            name: 'bars:barWidth',
                                            xtype: 'xflotspinnerfield',
                                            minValue: 0,
                                            maxValue: 100,
                                            fieldLabel: _('Bar Width')
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
            cfg.items = [
                seriesGroup,
                linesGroup,
                pointsGroup,
                barsGroup
            ];
        }
    });
    Ext.reg('xflotseriesstyle', Ext.ux.flot.SeriesStyleForm);
}());
