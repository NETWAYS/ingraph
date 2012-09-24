/**
 * Ext.ux.flot.Store
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
     * @class Ext.ux.flot.Store
     * @extends Ext.data.Store
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Data source for both {@link Ext.ux.flot.Flot} and {@link Ext.ux.flot.Panel}.
     * Noticeable enhancements to {@link Ext.data.Store} are auto-refresh and
     * record modification persistence.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotstore
     */
    Ext.ux.flot.Store = Ext.extend(Ext.data.Store, {
        /**
         * @cfg {Boolean} keepModifications
         * Whether to persist modifications of records over load operations. This
         * does not affect the <tt>data</tt> field. Useful if you apply flot style
         * information to records once and update the store with pure data later on.
         * Defaults to <tt>true</tt>
         */
        keepModifications: true,

        /**
         * @cfg {String} minxProperty
         * Name of the property from which to retrieve the start point of
         * available data <b>(required)</b>. Defaults to <tt>'min_timestamp'</tt>.
         */
        minxProperty: 'min_timestamp',

        /**
         * @cfg {String} maxxProperty
         * Name of the property from which to retrieve the end point of
         * available data <b>(required)</b>. Defaults to <tt>'max_timestamp'</tt>.
         */
        maxxProperty: 'max_timestamp',

        /**
         * @cfg {Number} refreshInterval
         * Autoload store each time the <tt>refreshInterval</tt> in milliseconds elapses.
         * The interval starts once the store is loaded for the first time.
         * Defaults to <tt>undefined</tt>.
         */

        /**
         * @cfg {Ext.data.DataReader} reader
         * Defaults to <tt>Ext.data.JsonReader</tt>.
         */

        /**
         * @cfg {Boolean/Object} autoLoad
         * Defaults to <tt>true</tt>.
         */

        /**
         * @cfg {String} root
         * Defaults to <tt>charts</tt>.
         */

        /**
         * @cfg {Boolean} autoDestroy
         * Defaults to <tt>true</tt>.
         */

        /**
         * @cfg {Array} fields
         * Defaults to <tt>{@link Ext.ux.flot.Fields.seriesFields}</tt>.
         */

        constructor: function (cfg) {
            Ext.applyIf(cfg, {
                autoDestroy: true,
                root: 'charts',
                fields: Ext.ux.flot.Fields.seriesFields(),
                autoLoad: true,
                idProperty: 'plot_id'
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
         * Dump data.
         * @method toJson
         * @return {Array}
         */
        toJson: function () {
            var separator = ':',
                json = [];

            this.each(function (rec) {
                var series = {};

                Ext.iterate(rec.fields.map, function (key, field) {
                    var value = rec.get(field.name);

                    if (value === field.defaultValue) {
                        // Skip
                        return true;
                    }
                    var path = field.name.split(separator),
                        last = path.pop(),
                        seriesPath = series;
                    Ext.each(path, function (key, i) {
                        if (!Ext.isObject(seriesPath[key])) {
                            seriesPath[key] = {};
                        }
                        seriesPath = seriesPath[key];
                    });
                    seriesPath[last] = value;
                });

                Ext.copyTo(series, rec.json, ['host', 'service', 'plot',
                                              'type']);

                json.push(series);
            });
            return json;
        },

        /**
         * Reload this store. Fires the {@link #beforeautorefresh} event.
         * A handler may return <tt>false</tt> to cancel loading.
         */
        autorefresh: function () {
            if (this.fireEvent('beforeautorefresh') !== false) {
                this.reload();
            }
        },

        /**
         * (Re)set autoloading.
         * @method startRefresh
         * @param {Number} interval
         * The interval in milliseconds.
         */
        startRefresh: function (interval) {
            if (interval !== undefined && interval !== this.refreshInterval) {
                this.refreshInterval = interval;
            }
            this.stopRefresh();
            this.refreshId = setInterval(this.autorefresh.createDelegate(this, []),
                this.refreshInterval * 1000);
            // TODO(el): Call startRefresh if this.refreshId on every load?
        },

        /**
         * Stop autoloading if set.
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
         * Determine whether this store is empty. Returns <tt>true</tt> if it
         * does not contain any record or if the {@link #root} property of
         * all records is empty.
         * @method isEmpty 
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

        // private
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

        // private
        destroy: function () {
            this.stopRefresh(); // Clear auto-refresh interval if any
            Ext.ux.flot.Store.superclass.destroy.call(this);
        }
    });
    Ext.reg('xflotstore', Ext.ux.flot.Store);
}());
