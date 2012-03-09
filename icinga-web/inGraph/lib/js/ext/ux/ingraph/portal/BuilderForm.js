/**
 * Ext.ux.ingraph.portal.BuilderForm
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.ingraph.
 *
 * Ext.ux.ingraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.ingraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.ingraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph.portal');

    /**
     * @class Ext.ux.ingraph.portal.BuilderForm
     * @extends Ext.FormPanel
     * @namespace Ext.ux.ingraph.portal
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigportalbuilder
     */
    Ext.ux.ingraph.portal.BuilderForm = Ext.extend(Ext.FormPanel, {
        /**
         * @cfg {String} columnsText
         * The quicktip text displayed for the label of the columns textfield
         * (defaults to help on Ext's flex property).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        columnsText: _('<p>Excpeted input is a comma-separated list of integers.</p>' +
            '<p>Each column will be flexed horizontally according to the columns\' relative ' +
            'value compared to the sum of all values.</p>'),

        // private
        rows: 0,

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            this.buildButtons(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.portal.BuilderForm.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            var items = [
                this.getNewRow()
            ];

            cfg.items = items;
        },

        // private
        getNewRow: function () {
            this.rows += 1;

            var row = {
                xtype: 'container',
                layout: 'hbox',
                layoutConfig: {},
                defaults: {
                    xtype: 'container',
                    layout: 'form',
                    flex: 1
                },
                items: [
                    {
                        items: [
                            {
                                xtype: 'displayfield',
                                fieldLabel: _('Row'),
                                name: 'row',
                                value: this.rows,
                                anchor: '95%'
                            }
                        ]
                    },
                    {
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: String.format(
                                    '<span ext:qtip="{0}">{1}</span>',
                                    Ext.util.Format.htmlEncode(this.columnsText),
                                    _('Columns')
                                ),
                                name: 'columns',
                                anchor: '95%',
                                stripCharsRe: /[^\d, ]+/g
                            }
                        ]
                    }
                ]
            };

            return row;
        },

        // private
        buildButtons: function (cfg) {
            var buttons = [
                {
                    text: _('Add Row'),
                    scope: this,
                    handler: this.addRowHandler
                }
            ];

            cfg.buttons = buttons;
        },

        // private
        addRowHandler: function () {
            this.add(this.getNewRow());
            this.doLayout();
        }
    });
    Ext.reg('xigportalbuilder', Ext.ux.ingraph.portal.BuilderForm);
}());
