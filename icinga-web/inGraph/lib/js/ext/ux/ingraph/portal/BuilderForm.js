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
    Ext.ns('Ext.ux.ingraph.portal');
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
        // private override
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            this.buildButtons(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.portal.BuilderForm.superclass.initComponent.call(this);
        },
        // private
        buildItems: function (cfg) {
            cfg.items = [
                this.getNewRow()
            ];
        },
        // private
        getNewRow: function () {
            this.rows += 1;
            return {
                xtype: 'container',
                layout: 'hbox',
                layoutConfig: {},
                defaults: {
                    xtype: 'container',
                    layout: 'form',
                    labelWidth: 50,
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
                                xtype: 'numberfield',
                                fieldLabel: _('Height'),
                                name: 'rowHeight',
                                value: 250,
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
                                value: 1,
                                stripCharsRe: /[^\d, ]+/g,
                                anchor: '95%'
                            }
                        ]
                    }
                ]
            };
        },
        // private
        buildButtons: function (cfg) {
            cfg.buttons = [
                {
                    text: _('Add Row'),
                    handler: this.addRowHandler.createDelegate(this)
                }
            ];
        },
        // private
        addRowHandler: function () {
            this.add(this.getNewRow());
            this.doLayout();
        }
    });
    Ext.reg('xigportalbuilder', Ext.ux.ingraph.portal.BuilderForm);
}());
