/**
 * Ext.ux.ingraph.icingaweb.ColumnRenderer
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph.icingaweb');

    /**
     * @class Ext.ux.ingraph.icingaweb.ColumnRenderer
     * @namespace Ext.ux.ingraph.icingaweb
     * @singleton
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Column Renderer.
     */
    Ext.ux.ingraph.icingaweb.ColumnRenderer = (function () {
        /**
         * Preview graph within a new window.
         * @method Preview
         * @private
         */
        var Preview = function (e, el) {
            var row = this.grid.getView().findRowIndex(el);

            if (row !== false) {
                var rec = this.store.getAt(row);

                Ext.ux.ingraph.icingaweb.Cronk.Window({
                    title: new Ext.XTemplate(this.cfg.title).apply(rec.data),
                    host: rec.get(this.cfg.host),
                    service: rec.get(this.cfg.service),
                    start: this.cfg.preview.start ?
                            Math.ceil(strtotime(this.cfg.preview.start)) : '',
                    height: this.cfg.preview.height,
                    width: this.cfg.preview.width,
                    overview: this.cfg.preview.overview
                });
            }
        };

        /**
         * Preview graph within a tooltip.
         * @method Popup
         * @private
         */
        var Popup = function (e, el) {
            var row = this.grid.getView().findRowIndex(el);

            if (row !== false) {
                var rec = this.store.getAt(row);

                Ext.ux.ingraph.icingaweb.Cronk.Popup({
                    title: new Ext.XTemplate(this.cfg.title).apply(rec.data),
                    host: rec.get(this.cfg.host),
                    service: rec.get(this.cfg.service),
                    start: this.cfg.popup.start ?
                            Math.ceil(strtotime(this.cfg.popup.start)) : '',
                    height: this.cfg.popup.height,
                    width: this.cfg.popup.width,
                    target: e.getTarget()
                });
            }
        };

        /**
         * Grid's store load listener. Adds listeners for mouseover, mouseout and
         * click to all ingraph columns of the grid.
         * @method onLoad
         * @private 
         */
        var onLoad = function () {
            var iGColumns = this.grid.el.select('div.iGColumn');

            iGColumns.each(function (column) {
                column.on({
                    scope: this,
                    mouseover: function (e, el) {
                        if (!this.task) {
                            // Execute Popup with this as scope
                            this.task = new Ext.util.DelayedTask(Popup, this);
                        }
                        this.task.delay(this.cfg.popup.timeout, null, null,
                                        [e, el]);
                    },
                    mouseout: function () {
                        if (this.task) {
                            this.task.cancel();
                            this.task = null;
                        }
                    },
                    // Execute Preview with this as scope
                    click: Preview.createDelegate(this)
                });
            }, this);
        };

        // public
        return {
            /**
             * Register this funtion in a icinga-web host and/or service
             * template-extension to enable graph popups and graph preview.
             * @method init
             * @param {Ext.grid.GridPanel} grid
             * @param {Object} cfg
             */
            init: function (grid, cfg) {
                var scope = {
                    grid: grid,
                    cfg: cfg,
                    store: grid.store
                };

                grid.store.on({
                    scope: scope,
                    load: onLoad
                });
            }
        }; // Eof return
    }());
}());
