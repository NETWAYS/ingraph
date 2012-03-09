/**
 * Ext.ux.flot.Template
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
     * @class Ext.ux.flot.Template
     * @extends Ext.data.GroupingStore
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflottemplate
     */
    Ext.ux.flot.Template = Ext.extend(Ext.data.GroupingStore, {
        /**
         * @cfg {Array} legendFields
         * Defaults to <tt>{@link Ext.ux.flot.Fields.legendFields}</tt>.
         */

        /**
         * @property {Ext.data.Record} legend
         * Legend configuration record.
         */

        /**
         * @cfg {Array} gridFields
         * Defaults to <tt>{@link Ext.ux.flot.Fields.gridFields}</tt>.
         */

        /**
         * @property {Ext.data.Record} grid
         * Grid configuration record.
         */

        /**
         * @cfg {Array} seriesFields
         * Defaults to <tt>{@link Ext.ux.flot.Fields.seriesTemplateFields}</tt>.
         */

        /**
         * @property {Ext.data.Record} seriesFields
         * Series configuration record.
         */

        /**
         * @cfg {Array} xaxisFields
         * Defaults to <tt>{@link Ext.ux.flot.Fields.xaxisFields}</tt>.
         */

        /**
         * @property {Ext.data.Record} xaxis
         * Xaxis configuration record.
         */

        /**
         * @cfg {Array} yaxisFields
         * Defaults to <tt>{@link Ext.ux.flot.Fields.yaxisFields}</tt>.
         */

        /**
         * @property {Ext.data.Record} Yaxis
         * Yaxis configuration record.
         */

        /**
         * @propery {Ext.data.JsonStore} yaxes
         * Yaxes store.
         */

        constructor: function (cfg) {
            cfg = cfg || {};

            this.applyDefaults(cfg);

            this.realizeBlueprints(cfg);

            // Hack to listen for datachanged event (w/o listeners config)
            // if data passed to the constructor
            this.addEvents('datachanged');
            this.on({
                scope: this,
                datachanged: this.onDatachanged
            });

            Ext.ux.flot.Template.superclass.constructor.call(this, cfg);

            this.xinitEvents();
        },

        // private
        applyDefaults: function (cfg) {
            Ext.applyIf(cfg, {
                root: 'series',
                groupField: 'group',
                fields: Ext.ux.flot.Fields.seriesTemplateFields,
                autoLoad: true,
                idProperty: 'plot_id'
            });
            cfg.reader = new Ext.data.JsonReader(cfg);
        },

        // private
        realizeBlueprints: function (cfg) {
            var legendFields = cfg.legendFields ||
                               Ext.ux.flot.Fields.legendFields;
            delete cfg.legendFields;
            this.legendBlueprint = Ext.data.Record.create(legendFields);
            this.legend = this.xcreateRecord(this.legendBlueprint, {
                backgroundOpacity: 0.4
            });

            var gridFields = cfg.gridFields ||
                             Ext.ux.flot.Fields.gridFields;
            delete cfg.gridFields;
            this.gridBlueprint = Ext.data.Record.create(gridFields);
            this.grid = this.xcreateRecord(this.gridBlueprint, {
                borderColor: 'rgba(255, 255, 255, 0)',
                borderWidth: 1
            });

            var seriesFields = cfg.seriesFields ||
                               Ext.ux.flot.Fields.seriesTemplateFields;
            delete cfg.seriesFields;
            this.seriesBlueprint = Ext.data.Record.create(seriesFields);
            this.series = this.xcreateRecord(this.seriesBlueprint);

            var xaxisFields = cfg.xaxisFields ||
                              Ext.ux.flot.Fields.xaxisFields;
            delete cfg.xaxisFields;
            this.xaxisBlueprint = Ext.data.Record.create(xaxisFields);
            this.xaxis = this.xcreateRecord(this.xaxisBlueprint);

            var yaxisFields = cfg.yaxisFields ||
                              Ext.ux.flot.Fields.yaxisFields.concat([
                                {
                                    name: 'index',
                                    defaultValue: null
                                }
                                ]);
            delete cfg.yaxisFields;
            this.yaxisBlueprint = Ext.data.Record.create(yaxisFields);
            this.yaxis = this.xcreateRecord(this.yaxisBlueprint);

            this.yaxes = new Ext.data.JsonStore({
                root: 'axes',
                idProperty: 'index',
                data: {
                    axes: []
                },
                fields: yaxisFields
            });
        },

        // private
        xcreateRecord: function (RecordType, jsonData) {
            var defaultData = {};

            jsonData = jsonData || {};

            // Use default values of fields
            Ext.iterate(RecordType.prototype.fields.map, function (key, field) {
                defaultData[field.name] = field.defaultValue;
            });

            // Copy missing key-value pairs from default data
            Ext.applyIf(jsonData, defaultData);

            var record = new RecordType(jsonData);

//            Ext.apply(record, new Ext.util.Observable(/* listeners */));
//            record.set = recordType.prototype.set.createSequence(function () {
//                this.fireEvent(/* ... */);
//            });

            return record;
        },

        // private
        onDatachanged: function () {
            var jsonData = this.reader.jsonData;

            if (Ext.isObject(jsonData.flot)) {
                var values;

                if (Ext.isObject(jsonData.flot.legend)) {
                    values = this.xprepareRecordValues(jsonData.flot.legend,
                                                       this.legendBlueprint);
                    this.xupdateRecord(this.legend, values);
                }

                if (Ext.isObject(jsonData.flot.grid)) {
                    values = this.xprepareRecordValues(jsonData.flot.grid,
                                                       this.gridBlueprint);
                    this.xupdateRecord(this.grid, values);
                }

                if (Ext.isObject(jsonData.flot.series)) {
                    values = this.xprepareRecordValues(jsonData.flot.series,
                                                       this.seriesBlueprint);
                    this.xupdateRecord(this.series, values);
                }

                if (Ext.isObject(jsonData.flot.xaxis)) {
                    values = this.xprepareRecordValues(jsonData.flot.xaxis,
                                                       this.xaxisBlueprint);
                    this.xupdateRecord(this.xaxis, values);
                }

                if (Ext.isObject(jsonData.flot.yaxis)) {
                    values = this.xprepareRecordValues(jsonData.flot.yaxis,
                                                       this.yaxisBlueprint);
                    this.xupdateRecord(this.yaxis, values);
                }

                if (Ext.isArray(jsonData.flot.yaxes)) {
                    Ext.each(jsonData.flot.yaxes, function (yaxis, index) {
                        yaxis.index = index + 1;
                    });

                    this.yaxes.loadData({
                        axes: jsonData.flot.yaxes
                    });
                }
            } // Eof jsonData.flot
        },

        // private
        xprepareRecordValues: function (json, recordConstructor) {
            var fields = recordConstructor.prototype.fields,
                items = fields.items,
                length = fields.length;

            var reader = new Ext.data.JsonReader(
                {
                    fields: fields
                },
                recordConstructor
            );

            var values = reader.extractValues(json, items, length);

            return values;
        },

        // private
        xupdateRecord: function (record, values) {
            Ext.iterate(values, function (fieldName, value) {
                record.set(fieldName, value);
            });
        },

        // private
        xinitEvents: function () {
            this.addEvents(
//                /**
//                 * @event gridupdate
//                 */
//                'gridupdate',
//                /**
//                 * @event legendupdate
//                 */
//                'legendupdate',
//                /**
//                 * @event xaxisupdate
//                 */
//                'xaxisupdate',
//                /**
//                 * @event yaxisupdate
//                 */
//                'yaxisupdate',
//                /**
//                 * @event seriesupdate
//                 */
//                'seriesupdate',
                /**
                 * @event axisadd
                 */
                'axisadd',
                /**
                 * @event axisupdate
                 */
                'axisupdate',
                /**
                 * @event axisremove
                 */
                'axisremove'
            );

            this.yaxes.on({
                scope: this,
                add: function () {
                    var fireArgs = ['axisadd'].concat(arguments);
                    this.fireEvent.apply(this, fireArgs);
                },
                update: function () {
                    var fireArgs = ['axisupdate'].concat(arguments);
                    this.fireEvent.apply(this, fireArgs);
                },
                remove: function () {
                    var fireArgs = ['axisremove'].concat(arguments);
                    this.fireEvent.apply(this, fireArgs);
                }
            });
        },

        // private
        xdump: function (record) {
            var separator = ':',
                dump = {};

            Ext.iterate(record.fields.map, function (key, field) {
                var value = record.get(field.name);
                if (value === field.defaultValue) {
                    // Skip
                    return true;
                }
                var path = field.name.split(separator),
                    last = path.pop(),
                    dumpPart = dump;
                Ext.each(path, function (key, i) {
                    if (!Ext.isObject(dumpPart[key])) {
                        dumpPart[key] = {};
                    }
                    dumpPart = dumpPart[key];
                });
                dumpPart[last] = value;
            });

            return dump;
        },

        /**
         * Get generic template information.
         * @method getStyle
         * @return {Object}
         */
        getStyle: function () {
            var style = {};

            style.legend = this.xdump(this.legend);
            if ($.isEmptyObject(style.legend)) {
                delete style.legend;
            }

            style.grid = this.xdump(this.grid);
            if ($.isEmptyObject(style.grid)) {
                delete style.grid;
            }

            style.series = this.xdump(this.series);
            if ($.isEmptyObject(style.series)) {
                delete style.series;
            }

            style.xaxis = this.xdump(this.xaxis);
            if ($.isEmptyObject(style.xaxis)) {
                delete style.xaxis;
            }

            style.yaxis = this.xdump(this.yaxis);
            if ($.isEmptyObject(style.yaxis)) {
                delete style.yaxis;
            }

            var yaxes = [];
            this.yaxes.each(function (record) {
                yaxes.push(this.xdump(record));
            }, this);
            if (yaxes.length > 0) {
                style.yaxes = yaxes;
            }

            return style;
        },

        /**
         * Dump data.
         * @method toJson
         * @return {Array}
         */
        toJson: function (copyTo) {
            var separator = ':',
                json = [];

            this.each(function (record) {
                var series = this.xdump(record);

                Ext.copyTo(series, record.json, copyTo);

                json.push(series);
            }, this);

            return json;
        },

        // private
        destroy: function () {
            this.yaxes.destroy();
            this.yaxes = null;

            Ext.ux.flot.Template.superclass.destroy.call(this);
        }
    });
    Ext.reg('xflottemplate', Ext.ux.flot.Template);
}());
