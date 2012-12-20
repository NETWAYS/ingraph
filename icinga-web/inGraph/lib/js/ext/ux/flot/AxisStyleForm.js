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
    var qtippedFieldLabel = Ext.ux.flot.AbstractStyleForm.qtippedFieldlabel;
    Ext.ns('Ext.ux.flot');
    Ext.ux.flot.AxisStyleForm = Ext.extend(Ext.ux.flot.AbstractStyleForm, {
        /**
         * @cfg {String} direction
         * <tt>'x'</tt> for x-axis. Defaults to <tt>undefined</tt> (y-axis).
         */

        /**
         * The quicktip text displayed for the label of the show checkbox
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        showText: _('Whether to show the axis'),
        /**
         * The quicktip text displayed for the label of the position combobox
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        positionText: _('Poisition of the axis'),
        /**
         * The quicktip text displayed for the label of the min numberfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        minText: _('Lower limit of the axis'),
        /**
         * The quicktip text displayed for the label of the max numberfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        maxText: _('Upper limit of the axis'),
        /**
         * The quicktip text displayed for the label of the color colorfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        colorText: _('Color for both labels and ticks'),
        /**
         * The quicktip text displayed for the label of the tick color colorfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        tickColorText: _('Alternate color for ticks'),
        /**
         * The quicktip text displayed for the label of the label textfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        labelText: _('Label of the axis'),
        /**
         * The quicktip text displayed for the label of the label width numberfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        labelWidthText: _('Width of the tick labels in pixels'),
        /**
         * The quicktip text displayed for the label of the label height numberfield
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        labelHeightText: _('Height of the tick labels in pixels'),
        // private override
        buildItems: function (cfg) {
            var appearanceGroup = {
                title: _('Appearance'),
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
                                    anchor: '95%'
                                },
                                items: [
                                    {
                                        xtype: 'checkbox',
                                        name: 'show',
                                        fieldLabel: _('Show'),
                                        qtip: this.showText
                                    },
                                    {
                                        xtype: 'textfield',
                                        name: 'label',
                                        fieldLabel: _('Label'),
                                        qtip: this.labelText,
                                        getValue: function () {
                                            var v = Ext.form.TextField.prototype.getValue.call(this);
                                            return v.split(',').map(function (label) {
                                                return Ext.util.Format.trim(label);
                                            });
                                        }
                                    },
                                    {
                                        xtype: 'combo',
                                        name: 'position',
                                        fieldLabel: _('Position'),
                                        qtip: this.positionText,
                                        triggerAction: 'all',
                                        hideTrigger: true,
                                        editable: true,
                                        mode: 'local',
                                        listeners: {
                                            render: function (combo) {
                                                combo.el.on({
                                                    click: function () {
                                                        combo.doQuery('', true);
                                                    }
                                                });
                                            }
                                        },
                                        store: this.direction === 'x' ?
                                                ['top', 'bottom'] :
                                                ['left', 'right']
                                    }
                                ]
                            }, // Eof column 1
                            {
                                defaults: {
                                    anchor: '95%',
                                    xtype: 'xflotnumberfield'
                                },
                                items: [
                                    {
                                        name: 'min',
                                        fieldLabel: _('Min'),
                                        qtip: this.minText
                                    },
                                    {
                                        name: 'labelWidth',
                                        fieldLabel: _('Label Width'),
                                        qtip: this.labelWidthText
                                    },
                                    {
                                        xtype: 'xcolorfield',
                                        lazyInit: false,
                                        name: 'color',
                                        fieldLabel: _('Color'),
                                        qtip: this.colorText
                                    }
                                ]
                            }, // Eof column 2
                            {
                                defaults: {
                                    anchor: '95%',
                                    xtype: 'xflotnumberfield'
                                },
                                items: [
                                    {
                                        name: 'max',
                                        fieldLabel: _('Max'),
                                        qtip: this.maxText
                                    },
                                    {
                                        name: 'labelHeight',
                                        fieldLabel: _('Label Height'),
                                        qtip: this.labelHeightText
                                    },
                                    {
                                        xtype: 'xcolorfield',
                                        lazyInit: false,
                                        name: 'tickColor',
                                        fieldLabel: _('Tick Color'),
                                        qtip: this.tickColorText
                                    }
                                ]
                            } // Eof column 3
                        ]
                    }
                ]
            };
            cfg.items = [
                appearanceGroup
            ];
        }
    });
    Ext.reg('xflotaxisstyle', Ext.ux.flot.AxisStyleForm);
}());
