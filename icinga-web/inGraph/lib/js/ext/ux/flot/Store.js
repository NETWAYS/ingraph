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

/*jshint browser: true */
/*global Ext, strtotime */

(function () {
    'use strict';
    Ext.ns('Ext.ux.flot');
    /**
     * Data source for both {@link Ext.ux.flot.Flot} and {@link Ext.ux.flot.Panel}.
     * Noticeable enhancements to {@link Ext.data.Store} are auto-refresh and
     * record modification persistence.
     * @author Eric Lippmann <eric.lippmann@netways.de>
     */
    Ext.ux.flot.Store = Ext.extend(Ext.data.Store, {
        /**
         * Whether to persist modifications of records over load operations. This
         * does not affect the <tt>data</tt> field. Useful if you apply flot style
         * information to records once and update the store with pure data later on.
         */
        keepModifications: true,
        /**
         * Name of the property from which to retrieve the start point of
         * available data <b>(required)</b>.
         */
        minxProperty: 'min_timestamp',
        /**
         * Name of the property from which to retrieve the end point of
         * available data <b>(required)</b>.
         */
        maxxProperty: 'max_timestamp',
        /**
         * @cfg {Number} refreshInterval
         * Autoload store each time the <tt>refreshInterval</tt> in milliseconds elapses.
         * The interval starts once the store is loaded for the first time.
         */
        /**
         * @cfg {Ext.data.DataReader} reader
         * Defaults to <tt>Ext.data.JsonReader</tt>.
         */

        autoDestroy: true,
        autoLoad: true,

        constructor: function (cfg) {
            Ext.applyIf(cfg, {
                root: 'charts',
                fields: Ext.ux.flot.Fields.seriesFields()
            });
            if (!cfg.reader) {
                cfg.reader = new Ext.data.JsonReader(cfg);
            }
            Ext.ux.flot.Store.superclass.constructor.call(this, cfg);
            this.on('beforeload', this.onBeforeLoad, this);
            this.addEvents(
                /**
                 * @event beforeautorefresh
                 * Fires before the store is auto-refreshed. A handler may return
                 * <tt>false</tt> to cancel the operation.
                 */
                'beforeautorefresh'
            );
            if (Ext.isNumber(this.refreshInterval)) {
                this.on({
                    scope: this,
                    single: true,
                    load: function () {
                        this.startRefresh();
                    }
                });
            }
            if (this.keepModifications === true) {
                this.on({
                    datachanged: function (store) {
                        store.suspendEvents();
                        Ext.each(store.getModifiedRecords(), function (mr) {
                            var r = store.getById(mr.id) ||
                                    store.getAt(
                                        store.find('label', mr.get('label')));
                            if (r) {
                                Ext.iterate(mr.getChanges(), function (k, v) {
                                    if (k !== 'data') {
                                        r.set(k, v);
                                    }
                                });
                            }
                        });
                        store.resumeEvents();
                    },
                    scope: this
                });
            }
        },
        /**
         * Dumps data.
         * @return {Array}
         */
        toJson: function () {
            var separator = ':',
                json = [];
            this.each(function (rec) {
                var series = {},
                    value,
                    path,
                    last,
                    seriesPath;
                Ext.iterate(rec.fields.map, function (key, field) {
                    value = rec.get(field.name);
                    if (value === field.defaultValue) {
                        // Continue
                        return true;
                    }
                    path = field.name.split(separator);
                    last = path.pop();
                    seriesPath = series;
                    Ext.each(path, function (key, i) {
                        if (!Ext.isObject(seriesPath[key])) {
                            seriesPath[key] = {};
                        }
                        seriesPath = seriesPath[key];
                    });
                    seriesPath[last] = value;
                });
                Ext.copyTo(
                    series,
                    rec.json,
                    ['host', 'parent_service', 'service', 'plot', 'type']
                );
                json.push(series);
            });
            return json;
        },
        /**
         * Reloads this store. Fires the {@link #beforeautorefresh} event.
         * A handler may return <tt>false</tt> to cancel loading.
         */
        autorefresh: function () {
            if (this.fireEvent('beforeautorefresh') !== false) {
                this.reload();
            }
        },
        /**
         * (Re)sets autoloading.
         * @param {Number} interval
         * The interval in milliseconds.
         */
        startRefresh: function (interval) {
            if (interval !== undefined && interval !== this.refreshInterval) {
                this.refreshInterval = interval;
            }
            this.stopRefresh();
            this.refreshId = setInterval(
                this.autorefresh.createDelegate(this, []),
                this.refreshInterval * 1000
            );
            // TODO(el): Call startRefresh if this.refreshId on every load?
        },
        /**
         * Stops autoloading if set.
         * @method stopRefresh
         */
        stopRefresh: function () {
            if (this.refreshId) {
                clearInterval(this.refreshId);
            }
        },

        getStartX: function () {
            return this.lastStart || this.getMinX();
        },

        getEndX: function () {
            return this.lastEnd || this.getMaxX();
        },

        getMinX: function () {
            return this.reader.jsonData[this.minxProperty];
        },

        getMaxX: function () {
            return this.reader.jsonData[this.maxxProperty];
        },

        /**
         * Determines whether this store is empty. Returns <tt>true</tt> if it
         * does not contain any record or if the {@link #root} property of
         * all records is empty.
         * @returns {Boolean} empty
         */
        isEmpty: function () {
            if (this.data.length === 0) {
                return true;
            }
            var empty = true;
            Ext.each(this.data.items, function (chart) {
                // Data property is the series array
                if (chart.data.data.length > 0) {
                    empty = false;
                    return false;
                }
            });
            return empty;
        },
        // private override
        onBeforeLoad: function (self, options) {
            if (options.params.startx === undefined &&
                Ext.isString(self.baseParams.startx))
            {
                options.params.startx = Math.ceil(strtotime(self.baseParams.startx));
            } else if (Ext.isString(options.params.startx)) {
                options.params.startx = Math.ceil(strtotime(options.params.startx));
            }
            if (options.params.endx === undefined &&
                Ext.isString(self.baseParams.endx))
            {
                options.params.endx = Math.ceil(strtotime(self.baseParams.endx));
            } else if (Ext.isString(options.params.endx)) {
                options.params.endx = Math.ceil(strtotime(options.params.endx));
            }
            this.lastStart = options.params.startx || self.baseParams.startx;
            this.lastEnd = options.params.endx || self.baseParams.endx;
        },
        // private override
        destroy: function () {
            this.stopRefresh(); // Clear auto-refresh interval if any
            Ext.ux.flot.Store.superclass.destroy.call(this);
        }
    });
    Ext.reg('xflotstore', Ext.ux.flot.Store);
}());
