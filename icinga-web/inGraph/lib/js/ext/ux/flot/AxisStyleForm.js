/**
 * Ext.ux.flot.AxisStyleForm
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
     * @class Ext.ux.flot.AxisStyleForm
     * @extends Ext.FormPanel
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotaxisstyle
     */
    Ext.ux.flot.AxisStyleForm = Ext.extend(Ext.ux.flot.AbstractStyleForm, {
        /**
         * @cfg {String} direction
         * <tt>'x'</tt> for x-axis. Defaults to <tt>undefined</tt> (y-axis).
         */

        /**
         * @cfg {String} showText
         * The quicktip text displayed for the label of the show checkbox
         * (defaults to <tt>'Whether to show the axis'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        showText: _('Whether to show the axis'),

        /**
         * @cfg {String} positionText
         * The quicktip text displayed for the label of the position combobox
         * (defaults to <tt>'Position of the axis'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        positionText: _('Poisition of the axis'),

        /**
         * @cfg {String} minText
         * The quicktip text displayed for the label of the min numberfield
         * (defaults to <tt>'Lower limit of the axis'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        minText: _('Lower limit of the axis'),

        /**
         * @cfg {String} maxText
         * The quicktip text displayed for the label of the max numberfield
         * (defaults to <tt>'Upper limit of the axis'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        maxText: _('Upper limit of the axis'),

        /**
         * @cfg {String} colorText
         * The quicktip text displayed for the label of the color colorfield
         * (defaults to <tt>'Color for both labels and ticks'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        colorText: _('Color for both labels and ticks'),

        /**
         * @cfg {String} tickColorText
         * The quicktip text displayed for the label of the tick color colorfield
         * (defaults to <tt>'Alternate color for ticks'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        tickColorText: _('Alternate color for ticks'),

        /**
         * @cfg {String} labelText
         * The quicktip text displayed for the label of the label textfield
         * (defaults to <tt>'Label of the axis'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        labelText: _('Label of the axis'),

        /**
         * @cfg {String} labelWidthText
         * The quicktip text displayed for the label of the label width numberfield
         * (defaults to <tt>'Width of the tick labels in pixels'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        labelWidthText: _('Width of the tick labels in pixels'),

        /**
         * @cfg {String} labelHeightText
         * The quicktip text displayed for the label of the label height numberfield
         * (defaults to <tt>'Height of the tick labels in pixels'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        labelHeightText: _('Height of the tick labels in pixels'),

        // private
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
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.showText),
                                            _('Show')
                                        )
                                    },
                                    {
                                        xtype: 'textfield',
                                        name: 'label',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.labelText),
                                            _('Label')
                                        ),
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
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.positionText),
                                            _('Position')
                                        ),
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
                                    xtype: 'numberfield'
                                },
                                items: [
                                    {
                                        name: 'min',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.minText),
                                            _('Min')
                                        ),
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
                                        name: 'labelWidth',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.labelWidthText),
                                            _('Label Width')
                                        ),
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
                                        name: 'color',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.colorText),
                                            _('Color')
                                        )
                                    }
                                ]
                            }, // Eof column 2
                            {
                                defaults: {
                                    anchor: '95%',
                                    xtype: 'numberfield'
                                },
                                items: [
                                    {
                                        name: 'max',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.maxText),
                                            _('Max')
                                        ),
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
                                        name: 'labelHeight',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.labelHeightText),
                                            _('Label Height')
                                        ),
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
                                        name: 'tickColor',
                                        fieldLabel: String.format(
                                            '<span ext:qtip="{0}">{1}</span>',
                                            Ext.util.Format.htmlEncode(this.tickColorText),
                                            _('Tick Color')
                                        )
                                    }
                                ]
                            } // Eof column 3
                        ]
                    }
                ] // Eof items
            };

            cfg.items = [
                appearanceGroup
            ];
        }
    });
    Ext.reg('xflotaxisstyle', Ext.ux.flot.AxisStyleForm);
}());
