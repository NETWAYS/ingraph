/**
 * Ext.ux.flot.SeriesConfiguration
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

    Ext.ns('Ext.ux.flot.SeriesConfiguration');

    /**
     * @class Ext.ux.flot.SeriesConfiguration
     * @extends Ext.Panel
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Configuration panel for series <tt>{@link Ext.ux.flot.Template}</tt>.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotseriesconfig
     */
    Ext.ux.flot.SeriesConfiguration = Ext.extend(Ext.Panel, {
        layout: 'fit',

        /**
         * @cfg {Ext.ux.flot.Template} store The {@link Ext.ux.flot.Template}
         * the component should use as its data source <b>(required)</b>.
         */

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.SeriesConfiguration.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'editorgrid',
                    ref: 'seriesGrid',
                    view: new Ext.grid.GroupingView({
                        forceFit: true,
                        groupTextTpl: '{text} ({[values.rs.length]} ' +
                            '{[values.rs.length > 1 ? "Items" : "Item"]})',
                        showGroupName: false
                    }),
                    plugins: [new Ext.ux.grid.CheckColumn()],
                    store: this.store,
                    sm: new Ext.grid.RowSelectionModel({
                        listeners: {
                            scope: this,
                            selectionchange: function (sm) {
                                if (!sm.getSelected()) {
                                    this.editPlotBtn.disable();
                                    this.removePlotBtn.disable();
                                } else {
                                    this.editPlotBtn.enable();
                                    this.removePlotBtn.enable();
                                }
                            }
                        }
                    }),
                    cm: new Ext.grid.ColumnModel({
                        defaults: {
                            sortable: true
                        },
                        columns: [
                            {
                                xtype: 'checkcolumn',
                                header: _('Enabled'),
                                dataIndex: 'enabled',
                                align: 'center',
                                width: 60
                            },
                            {
                                header: _('Group'),
                                dataIndex: 'group',
                                hidden: true
                            },
                            {
                                header: _('Label'),
                                dataIndex: 'label',
                                width: 160,
                                editor: {
                                    xtype: 'textfield'
                                }
                            },
                            {
                                header: _('Unit'),
                                dataIndex: 'unit',
                                width: 80
                            },
                            {
                                header: _('Type'),
                                dataIndex: 'type',
                                align: 'center',
                                width: 100
                            },
                            {
                                header: _('Color'),
                                dataIndex: 'color',
                                xtype: 'xcolorcolumn',
                                editor: {
                                    xtype: 'xcolorfield',
                                    lazyInit: false
                                }
                            },
                            {
                                header: _('Y-Axis'),
                                dataIndex: 'yaxis',
                                editor: {
                                    xtype: 'xigautocombo',
                                    mode: 'local',
                                    displayField: 'index',
                                    valueField: 'index',
                                    store: this.store.yaxes,
                                    getValue: function () {
                                        var v = Ext.ux.ingraph.AutoComboBox.prototype.getValue.call(this);

                                        // Ext returns '' on invalid / empty values
                                        if (v === '') {
                                            // Flot requires null for auto-detect
                                            return null;
                                        }

                                        return v;
                                    }
                                }
                            }
                        ] // Eof columns
                    }), // Eof column model
                    bbar: [
                        {
                            text: _('Add Plot'),
                            iconCls: 'x-flot-add-icon',
                            scope: this,
                            handler: this.addPlotHandler
                        },
                        {
                            text: _('Edit Plot'),
                            disabled: true,
                            iconCls: 'x-flot-settings-icon',
                            scope: this,
                            handler: this.editPlotHandler,
                            ref: '../../editPlotBtn'
                        },
                        {
                            text: _('Remove Plot'),
                            disabled: true,
                            iconCls: 'x-flot-delete-icon',
                            scope: this,
                            handler: this.removePlotHandler,
                            ref: '../../removePlotBtn'
                        }
                    ] // Eof bbar
                } // Eof series editor grid
            ]; // Eof items
        },

        // private
        addPlotHandler: Ext.emptyFn,

        // private
        editPlotHandler: function () {
            var selectedRecord = this.seriesGrid.getSelectionModel().getSelected();

            var editPlotWindow = new Ext.ux.flot.FormWindow({
                title: _('Series Options'),
                width: 700,
                height: 525,
                items: [
                    {
                        xtype: 'xflotseriesstyle',
                        baseCls: 'x-plain',
                        ref: 'form',
                        record: selectedRecord
                    }
                ],
                applyHandler: function () {
                    this.form.getForm().updateRecord(selectedRecord);
                },
                buttons: [
                    {
                        text: _('Reset'),
                        iconCls: 'x-flot-reset-icon',
                        scope: this,
                        handler: function (btn) {
                            selectedRecord.reject(true); // Don't notify store

                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt;

                            win.form.getForm().loadRecord(selectedRecord);
                        }
                    }
                ] // Eof buttons
            }); // Eof new edit plot window

            editPlotWindow.show();
        },

        // private
        removePlotHandler: function () {
            var sm = this.seriesGrid.getSelectionModel(),
                selectedRecords = sm.getSelections();

            if (selectedRecords) {
                this.store.remove(selectedRecords);

                sm.clearSelections();
            }
        }
    });
    Ext.reg('xflotseriesconfig', Ext.ux.flot.SeriesConfiguration);
}());
