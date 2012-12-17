/**
 * Ext.ux.ingraph.AddPlotWindow
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
     * @class Ext.ux.ingraph.AddPlotWindow
     * @extends Ext.ux.flot.FormWindow
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * Choose a plot to add to series.
     * @param {Object} cfg
     * A config object.
     */
    Ext.ux.ingraph.AddPlotWindow = Ext.extend(Ext.ux.flot.FormWindow, {
        title: _('Add Plot'),

        width: 280,

        height: 180,

        /**
         * @cfg {String} serviceText
         * The quicktip text displayed for the service combobox.
         * (defaults to <tt>'Leave this field empty if you want display the host graph'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        serviceText: _('Leave this field empty if you want display the host graph'),

        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'form',
                    ref: 'form',
                    monitorValid: true,
                    defaults: {
                        xtype: 'xigautocombo',
                        width: 180,
                        allowBlank: false,
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
                    },
                    baseCls: 'x-plain',
                    labelWidth: 55,
                    items: [
                        {
                            name: 'host',
                            ref: 'hostCombo',
                            fieldLabel: _('Host'),
                            emptyText: _('Choose Host'),
                            store: {
                                xtype: 'jsonstore',
                                root: 'hosts',
                                fields: ['host'],
                                idProperty: 'host',
                                url: Ext.ux.ingraph.Urls.provider.hosts
                            },
                            displayField: 'host',
                            valueField: 'host',
                            plugins: [
                                new Ext.ux.ComboController('serviceCombo',
                                                           'plotCombo')
                            ]
                        },
                        {
                            name: 'service',
                            ref: 'serviceCombo',
                            fieldLabel: _('Service'),
                            emptyText: _('Choose Service'),
                            qtip: this.serviceText,
                            allowBlank: true,
                            disabled: true,
                            store: {
                                xtype: 'jsonstore',
                                root: 'services',
                                fields: [
                                    'name',
                                    'service',
                                    'parentService'
                                ],
                                idProperty: 'name',
                                url: Ext.ux.ingraph.Urls.provider.services
                            },
                            displayField: 'name',
                            valueField: 'service',
                            plugins: [
                                new Ext.ux.ComboDependency({
                                    ref: 'hostCombo',
                                    param: 'host'
                                })
                            ]
                        },
                        {
                            name: 'plot',
                            ref: 'plotCombo',
                            fieldLabel: _('Plot'),
                            emptyText: _('Choose Plot'),
                            disabled: true,
                            store: {
                                xtype: 'jsonstore',
                                root: 'plots',
                                fields: ['plot', 'service'],
                                idProperty: 'plot',
                                paramNames: {
                                    start: 'offset'
                                },
                                baseParams: {
                                    offset: 0,
                                    limit: 20
                                },
                                url: Ext.ux.ingraph.Urls.provider.plots
                            },
                            displayField: 'plot',
                            valueField: 'plot',
                            plugins: [
                                new Ext.ux.ComboDependency(
                                    {
                                        ref: 'hostCombo',
                                        param: 'host'
                                    },
                                    {
                                        ref: 'serviceCombo',
                                        param: ['service', 'parentService']
                                    }
                                ),
                                new Ext.ux.ComboController('typeCombo')
                            ]
                        },
                        {
                            name: 'type',
                            ref: 'typeCombo',
                            fieldLabel: _('Type'),
                            emptyText: _('Choose Type'),
                            disabled: true,
                            mode: 'local',
                            store: ['avg', 'min', 'max', 'lower_limit',
                                    'upper_limit', 'warn_lower', 'warn_upper',
                                    'crit_lower', 'crit_upper']
                        }
                    ] // Eof form items
                } // Eof form
            ]; // Eof items
        },

        getValues: function () {
            var values = Ext.ux.ingraph.AddPlotWindow.superclass.getValues
                .call(this);
            values.parentService = this.form.serviceCombo.getSelectedRecord() ?
                this.form.serviceCombo.getSelectedRecord().get('parentService') :
                null;
            return values;
        }
    });
}());
