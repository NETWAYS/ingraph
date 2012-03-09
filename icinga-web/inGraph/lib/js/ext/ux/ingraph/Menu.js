/**
 * Ext.ux.ingraph.Menu
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

    Ext.ns('Ext.ux.ingraph');

    /**
     * @class Ext.ux.ingraph.Menu
     * @extends Ext.FormPanel
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * Form to choose a host, host-service or view to plot. Listen to the
     * <tt>plot</tt> event to handle plotting.
     * @param {Object} cfg
     * A config object.
     * @xtype xigmenu
     */
    Ext.ux.ingraph.Menu = Ext.extend(Ext.FormPanel, {
        frame: true,

        // This component contains only one direct child item (table)
        layout: 'fit',

        bodyStyle: 'padding: 5px;',

        /**
         * @cfg {String} serviceText
         * The quicktip text displayed for the service combobox.
         * (defaults to <tt>'Leave this field empty if you want display the host graph'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        serviceText: _('Leave this field empty if you want display the host graph'),

        /**
         * @cfg {String} dateText
         * The quicktip text displayed for the start and end datefield.
         * (defaults to help on english textual date or time).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        dateText: _('Either select date via the popup date picker or input an ' +
                    'English textual date or time, i.e.<br />' +
                    '<ul style="list-style-type:circle;' +
                        'list-style-position:inside;">' +
                        '<li>now</li>' +
                        '<li>last month</li>' +
                        '<li>last mon(day)</li>' +
                        '<li>last year 6 months</li>' +
                        '<li>-6 hours 30 minutes 10 secs</li>' +
                        '<li>-1 month + 10 days</li>' +
                        '<li>3 October 2005</li>' +
                    '</ul>'),

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.Menu.superclass.initComponent.call(this);
            this.addEvents(
                /**
                 * @event {plot}
                 * Fires after either clicking the display graph or display view
                 * button.
                 * @param {Ext.ux.ingraph.Menu} this
                 * @param {Object} cfg Plot information
                 */
                'plot'
           );
        },

        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'container',
                    layout: 'table',
                    layoutConfig: {
                        columns: 6
                    },
                    defaults: {
                        bodyStyle: 'padding: 5px;',
                        layout: 'form',
                        hideLabels: true,
                        defaults: {
                            listeners: {
                                render: function (item) {
                                    if (item.qtip) {
                                        Ext.QuickTips.register({
                                            target: item.el,
                                            text: item.qtip,
                                            // Do not dismiss automatically
                                            dismissDelay: 0
                                        });
                                    }
                                }
                            }
                        }
                    },
                    items: [
                        {
                            items: [
                                {
                                    name: 'host',
                                    xtype: 'xigautocombo',
                                    ref: '../../hostCombo',
                                    emptyText: _('Choose host'),
                                    store: {
                                        xtype: 'arraystore',
                                        root: 'results',
                                        fields: ['host'],
                                        idProperty: 'host',
                                        url: Ext.ux.ingraph.Urls.provider.hosts
                                    },
                                    displayField: 'host',
                                    valueField: 'host',
                                    plugins: [
                                        new Ext.ux.ComboController('serviceCombo',
                                                                   'dispGraphBtn')
                                    ]
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    name: 'service',
                                    xtype: 'xigautocombo',
                                    ref: '../../serviceCombo',
                                    emptyText: _('Choose service'),
                                    store: {
                                        xtype: 'arraystore',
                                        root: 'results',
                                        fields: ['service'],
                                        idProperty: 'service',
                                        url: Ext.ux.ingraph.Urls.provider.services
                                    },
                                    displayField: 'service',
                                    valueField: 'service',
                                    plugins: [
                                        new Ext.ux.ComboDependency({
                                            ref: 'hostCombo',
                                            param: 'host'
                                        })
                                    ],
                                    disabled: true,
                                    qtip: this.serviceText
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'button',
                                    ref: '../../dispGraphBtn',
                                    text: _('Display Graph'),
                                    width: 80,
                                    cls: 'x-btn-text-left',
                                    disabled: true,
                                    scope: this,
                                    handler: this.displayGraphHandler
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    name: 'start',
                                    ref: '../../startDateField',
                                    xtype: 'datefield',
                                    format: 'Y-m-d H:i:s',
                                    emptyText: _('Starttime'),
                                    width: 150,
                                    qtip: this.dateText
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    name: 'end',
                                    ref: '../../endDateField',
                                    xtype: 'datefield',
                                    format: 'Y-m-d H:i:s',
                                    emptyText: _('Endtime'),
                                    width: 150,
                                    qtip: this.dateText
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'container',
                                    autoEl: {
                                        tag: 'div',
                                        cls: 'ingraph-logo',
                                        style: 'height: 65px; width: 190px;'
                                    }
                                }
                            ],
                            rowspan: 2
                        },
                        {
                            items: [
                                {
                                    name: 'view',
                                    xtype: 'xigautocombo',
                                    ref: '../../viewCombo',
                                    emptyText: _('Choose view'),
                                    width: 490,
                                    store: {
                                        xtype: 'arraystore',
                                        root: 'results',
                                        fields: ['view'],
                                        idProperty: 'view',
                                        url: Ext.ux.ingraph.Urls.provider.views
                                    },
                                    displayField: 'view',
                                    valueField: 'view',
                                    plugins: [
                                        new Ext.ux.ComboController('dispViewBtn')
                                    ]
                                }
                            ],
                            colspan: 2
                        },
                        {
                            items: [
                                {
                                    xtype: 'button',
                                    ref: '../../dispViewBtn',
                                    text: _('Display View'),
                                    width: 80,
                                    cls: 'x-btn-text-left',
                                    disabled: true,
                                    scope: this,
                                    handler: this.displayViewHandler
                                }
                            ]
                        }
                    ]
                } // Eof table
            ]; // Eof items
        },

        // private
        displayGraphHandler: function () {
            var values = this.getForm().getValues();

            // View value not needed for host / service graphs
            delete values.view;

            // Overwrite start and end
            values.start = this.startDateField.strValue ||
                           this.startDateField.getValue() ?
                           this.startDateField.getValue().getTime() / 1000 : null;
            values.end = this.endDateField.strValue ||
                         this.endDateField.getValue() ?
                         this.endDateField.getValue().getTime() / 1000 : null;

            this.fireEvent('plot', this, values);
        },

        // private
        displayViewHandler: function () {
            var values = {
                view: this.viewCombo.getValue()
            };

            this.fireEvent('plot', this, values);
        }
    });
    Ext.reg('xigmenu', Ext.ux.ingraph.Menu);
}());
