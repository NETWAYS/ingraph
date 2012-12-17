/**
 * Ext.ux.flot.SeriesStyleForm
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.flot.
 *
 * Ext.ux.flot is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.flot is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.flot. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.flot');

    /**
     * @class Ext.ux.flot.SeriesStyleForm
     * @extends Ext.ux.flot.AbstractStyleForm
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Form to edit the appearance of a flot series.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotseriesstyle
     */
    Ext.ux.flot.SeriesStyleForm = Ext.extend(Ext.ux.flot.AbstractStyleForm, {
        colorText: _(''),
        fillColorText: _(''),
        linesShowText: _('Specify whether lines should be shown.'),
        linesSplineText: _('Draw a curve by inserting bogus data.'),
        linesStepsText: _('Enable "steps" to cascade lines.'),
        linesFillText: _('Enable "fill" to produce area charts.'),
        linesWidthText: _('Thickness of the line in pixels.'),

        // private
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
//                            {
//                                items: [
//                                    {
//                                        xtype: 'textfield',
//                                        fieldLabel: _('Unit'),
//                                        name: 'unit',
//                                        anchor: '95%'
//                                    }
//                                ]
//                            },
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
//                    ,{
//                        defaults: {
//                            xtype: 'container',
//                            layout: 'form',
//                            flex: 1
//                        },
//                        items: [
//                            {
//                                items: [
//                                    {
//                                        xtype: 'checkbox',
//                                        fieldLabel: _('Stack'),
//                                        name: 'stack',
//                                        anchor: '95%'
//                                    }
//                                ]
//                            },
//                            {
////                                flex: 2,
//                                items: [
//                                    {
//                                        xtype: 'textfield',
//                                        fieldLabel: _('Fill Between'),
//                                        name: 'fillBetween',
//                                        anchor: '95%'
////                                        anchor: '47.75%'
//                                    }
//                                ]
//                            }
//                        ]
//                    }
//                    ,{
//                        defaults: {
//                            xtype: 'container',
//                            layout: 'form',
//                            flex: 1
//                        },
//                        items: [
//                            {
//                                items: [
//                                    {
//                                        xtype: 'textarea',
//                                        fieldLabel: _('Convert'),
//                                        name: 'convert',
//                                        anchor: '99%'
//                                    }
//                                ]
//                            }
//                        ]
//                    }
                ]
            }; // Eof series group

            var linesGroup = {
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
                                defaults: {
                                    xtype: 'checkbox',
                                    anchor: '95%'
                                },
                                items: [
                                    {
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.linesShowText),
                                            _('Show')
                                        ),
                                        name: 'lines:show'
                                    },
                                    {
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.linesSplineText),
                                            _('Smooth')
                                        ),
                                        name: 'lines:spline',
                                        // Disabled until https://github.com/flot/flot/pull/872 got merged
                                        disabled: true
                                    }
                                ]
                            },
                            {
                                labelWidth: 70,
                                defaults: {
                                    anchor: '95%',
                                    xtype: 'checkbox'
                                },
                                items: [
                                    {
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.linesStepsText),
                                            _('Steps')
                                        ),
                                        name: 'lines:steps'
                                    },
                                    {
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.linesFillText),
                                            _('Fill')
                                        ),
                                        name: 'lines:fill'
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
                                        xtype: 'spinnerfield',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.linesWidthText),
                                            _('Line Width')
                                        ),
                                        minValue: 0,
                                        maxValue: 100,
                                        name: 'lines:lineWidth',
                                        getValue: function () {
                                            var v = Ext.form.NumberField.prototype.getValue.call(this);

                                            // Ext returns '' on invalid / empty values
                                            if (v === '') {
                                                // Flot requires null for auto-detect
                                                return null;
                                            }

                                            return v;
                                        }
                                    },
                                    {
                                        xtype: 'xcolorfield',
                                        lazyInit: false,
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.fillColorText),
                                            _('Fill Color')
                                        ),
                                        name: 'lines:fillColor'
                                    }
                                ]
                            }
                        ]
                    } // Eof column layout container
                ] // Eof lines group items
            }; // Eof lines group

            var pointsGroup = {
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
                                        xtype: 'spinnerfield',
                                        fieldLabel: _('Radius'),
                                        minValue: 0,
                                        maxValue: 100,
                                        name: 'points:radius',
                                        getValue: function () {
                                            var v = Ext.form.NumberField.prototype.getValue.call(this);

                                            // Ext returns '' on invalid / empty values
                                            if (v === '') {
                                                // Flot requires null for auto-detect
                                                return null;
                                            }

                                            return v;
                                        }
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
                                items: [
                                    {
                                        xtype: 'spinnerfield',
                                        fieldLabel: _('Line Width'),
                                        minValue: 0,
                                        maxValue: 100,
                                        name: 'points:lineWidth',
                                        anchor: '95%',
                                        getValue: function () {
                                            var v = Ext.form.NumberField.prototype.getValue.call(this);

                                            // Ext returns '' on invalid / empty values
                                            if (v === '') {
                                                // Flot requires null for auto-detect
                                                return null;
                                            }

                                            return v;
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }; // Eof points group

            var barsGroup = {
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
                                defaults: {
                                    anchor: '95%',
                                    xtype: 'checkbox'
                                },
                                items: [
                                    {
                                        fieldLabel: _('Show'),
                                        name: 'bars:show'
                                    },
                                    {
                                        fieldLabel: _('Fill'),
                                        name: 'bars:fill'
                                    },
                                    {
                                        xtype: 'xigautocombo',
                                        mode: 'local',
                                        store: ['left', 'center'],
                                        fieldLabel: _('Align'),
                                        name: 'bars:align'
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
                                        xtype: 'spinnerfield',
                                        fieldLabel: _('Line Width'),
                                        minValue: 0,
                                        maxValue: 100,
                                        name: 'bars:lineWidth',
                                        anchor: '95%',
                                        getValue: function () {
                                            var v = Ext.form.NumberField.prototype.getValue.call(this);

                                            // Ext returns '' on invalid / empty values
                                            if (v === '') {
                                                // Flot requires null for auto-detect
                                                return null;
                                            }

                                            return v;
                                        }
                                    },
                                    {
                                        xtype: 'xcolorfield',
                                        lazyInit: false,
                                        fieldLabel: _('Fill Color'),
                                        name: 'bars:fillColor'
                                    },
                                    {
                                        fieldLabel: _('Horizontal'),
                                        name: 'bars:horizontal',
                                        xtype: 'checkbox'
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
                                        xtype: 'spinnerfield',
                                        fieldLabel: _('Bar Width'),
                                        minValue: 0,
                                        maxValue: 100,
                                        name: 'bars:barWidth',
                                        getValue: function () {
                                            var v = Ext.form.NumberField.prototype.getValue.call(this);

                                            // Ext returns '' on invalid / empty values
                                            if (v === '') {
                                                // Flot requires null for auto-detect
                                                return null;
                                            }

                                            return v;
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }; // Eof bars group

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
