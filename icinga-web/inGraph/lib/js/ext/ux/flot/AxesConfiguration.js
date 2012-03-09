/**
 * Ext.ux.flot.AxesConfiguration
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

    Ext.ns('Ext.ux.flot.AxesConfiguration');

    /**
     * @class Ext.ux.flot.AxesConfiguration
     * @extends Ext.Panel
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Configuration panel for axes of <tt>{@link Ext.ux.flot.Template}</tt>.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotaxesconfig
     */
    Ext.ux.flot.AxesConfiguration = Ext.extend(Ext.Panel, {
        layout: 'fit',

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.AxesConfiguration.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'editorgrid',
                    ref: 'axesGrid',
                    store: this.store,
                    sm: new Ext.grid.RowSelectionModel({
                        listeners: {
                            scope: this,
                            selectionchange: function (sm) {
                                if (!sm.getSelected()) {
                                    this.editAxisBtn.disable();
                                    this.removeAxisBtn.disable();
                                } else {
                                    this.editAxisBtn.enable();
                                    this.removeAxisBtn.enable();
                                }
                            }
                        }
                    }), // Eof selection model
                    cm: new Ext.grid.ColumnModel({
                        defaults: {
                            sortable: true,
                            align: 'center',
                            width: 100
                        },
                        columns: [
                            {
                                header: _('Index'),
                                dataIndex: 'index',
                                width: 50
                            },
                            {
                                header: _('Label'),
                                dataIndex: 'label',
                                width: 190,
                                editor: {
                                    xtype: 'textfield',
                                    getValue: function () {
                                        var v = Ext.form.TextField.prototype.getValue.call(this);

                                        return v.split(',').map(function (label) {
                                            return Ext.util.Format.trim(label);
                                        });
                                    }
                                }
                            },
                            {
                                header: _('Unit'),
                                dataIndex: 'unit',
                                editor: {
                                    xtype: 'xigautocombo',
                                    mode: 'local',
                                    store: ['raw', 'percent', 'time', 'byte', 'c']
                                }
                            },
                            {
                                header: _('Position'),
                                dataIndex: 'position',
                                editor: {
                                    xtype: 'xigautocombo',
                                    mode: 'local',
                                    store: ['left', 'right']
                                }
                            },
                            {
                                header: _('Min'),
                                dataIndex: 'min',
                                width: 50,
                                editor: {
                                    xtype: 'numberfield',
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
                            },
                            {
                                header: _('Max'),
                                dataIndex: 'max',
                                width: 50,
                                editor: {
                                    xtype: 'numberfield',
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
                            }
                        ] // Eof columns
                    }), // Eof column model
                    bbar: [
                        {
                            text: _('Add Axis'),
                            iconCls: 'xflot-icon-add',
                            scope: this,
                            handler: this.addAxisHandler
                        },
                        {
                            text: _('Edit Axis'),
                            disabled: true,
                            iconCls: 'xflot-icon-settings',
                            scope: this,
                            handler: this.editAxisHandler,
                            ref: '../../editAxisBtn'
                        },
                        {
                            text: _('Remove Axis'),
                            disabled: true,
                            iconCls: 'xflot-icon-delete',
                            scope: this,
                            handler: this.removeAxisHandler,
                            ref: '../../removeAxisBtn'
                        }
                    ] // Eof bbar
                } // Eof series editor grid
            ]; // Eof items
        },

        // private
        addAxisHandler: function () {
            // TODO(el): Duplicate code, see Flot.js:applyTemplate
            var recordData = {};

            // Use default values of fields
            Ext.iterate(this.store.fields.map, function (key, field) {
                recordData[field.name] = field.defaultValue;
            });

            // Overwrite index
            recordData.index = this.store.data.length + 1;

            var record = new this.store.recordType(recordData, recordData.index);

            this.store.add(record);
        },

        // private
        editAxisHandler: function () {
            var selectedRecord = this.axesGrid.getSelectionModel().getSelected();

            var editAxisWindow = new Ext.ux.flot.FormWindow({
                title: _('Axis Options'),
                width: 700,
                height: 200,
                items: [
                    {
                        xtype: 'xflotaxisstyle',
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
                        iconCls: 'xflot-icon-reset',
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

            editAxisWindow.show();
        },

        // private
        removeAxisHandler: function () {
            var sm = this.axesGrid.getSelectionModel(),
                selectedRecords = sm.getSelections();

            if (selectedRecords) {
                this.store.remove(selectedRecords);

                sm.clearSelections();
            }
        }
    });
    Ext.reg('xflotaxesconfig', Ext.ux.flot.AxesConfiguration);
}());
