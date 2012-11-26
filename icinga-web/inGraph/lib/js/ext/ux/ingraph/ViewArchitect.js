/**
 * Ext.ux.ingraph.ViewArchitect
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
     * @class Ext.ux.ingraph.ViewArchitect
     * @extends Ext.Container
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @xtype xiviewarchitect
     */
    Ext.ux.ingraph.ViewArchitect = Ext.extend(Ext.Container, {
        layout: 'hbox',
        layoutConfig: {
            align: 'stretch',
            pack: 'start'
        },
        // private override
        initComponent: function () {
            this.buildStores();
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.ViewArchitect.superclass.initComponent.call(this);
        },
        // private
        buildStores: function () {
            this.storeToChooseFrom = new Ext.data.JsonStore({
                root: 'plots',
                fields: [
                    'id',
                    'host',
                    'service',
                    'parentService',
                    'plot'
                ],
                idProperty: 'id',
                url: Ext.ux.ingraph.Urls.provider.plots,
                baseParams: {
                    start: 0,
                    limit: 20
                }
            });
        },
        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'grid',
                    store: this.storeToChooseFrom,
                    cm: new Ext.grid.ColumnModel({
                        defaults:
                        {
                            width: 150,
                            sortable: true
                        },
                        columns: [
                            {
                                header: _('Host Name'),
                                dataIndex: 'host'
                            },
                            {
                                header: _('Service Name'),
                                dataIndex: 'service'
                            },
                            {
                                header: _('Parent Service Name'),
                                dataIndex: 'parent_service'
                            },
                            {
                                header: _('Plot Name'),
                                dataIndex: 'plot'
                            }
                        ]
                    }),
                    sm: new Ext.grid.CheckboxSelectionModel({
                        listeners: {
                            scope: this,
                            selectionchange: function (sm) {
                                if (sm.getSelected() === undefined) {
                                    // No more selections
//                                    this.handleDeselectAll();
                                } else {
//                                    this.handleSelectAny();
                                }
                            }
                        }
                    }),
                    tbar: [
                        _('Host:'),
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
                                new Ext.ux.StoreFilter({
                                    store: this.storeToChooseFrom,
                                    param: 'host'
                                })
                            ]
                        },
                        _('Service:'),
                        {
                            name: 'service',
                            xtype: 'xigautocombo',
                            ref: '../../serviceCombo',
                            emptyText: _('Choose service'),
                            store: {
                                xtype: 'jsonstore',
                                root: 'results',
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
                                }),
                                new Ext.ux.StoreFilter({
                                    store: this.storeToChooseFrom,
                                    param: 'service'
                                })
                            ]
                        },
                        _('Plot:'),
                        {
                            name: 'plot',
                            xtype: 'xigautocombo',
                            ref: '../../plotCombo',
                            emptyText: _('Choose plot'),
                            store: {
                                xtype: 'jsonstore',
                                root: 'plots',
                                fields: [
                                    'id',
                                    'host',
                                    'service',
                                    'parentService',
                                    'plot'
                                ],
                                idProperty: 'plot',
                                url: Ext.ux.ingraph.Urls.provider.plots
                            },
                            displayField: 'plot',
                            valueField: 'plot',
                            queryParam: 'plot',
                            plugins: [
                                new Ext.ux.ComboDependency({
                                    ref: 'hostCombo',
                                    param: 'host'
                                }),
                                new Ext.ux.ComboDependency({
                                    ref: 'serviceCombo',
                                    param: 'service'
                                }),
                                new Ext.ux.StoreFilter({
                                    store: this.storeToChooseFrom,
                                    param: 'plot'
                                })
                            ]
                        }
                    ],
                    bbar: {
                        xtype: 'paging',
                        store: this.storeToChooseFrom,
                        displayInfo: true,
                        pageSize: 20
                    }
                }
            ];
        }
    });
    Ext.reg('xiviewarchitect', Ext.ux.ingraph.ViewArchitect);
}());
