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

/*global Ext, Cronk, strtotime */

(function () {
    'use strict';
    Ext.ns('Ext.ux.ingraph.icingaweb');
    /**
     * Icinga-web column-renderer.
     * @author Eric Lippmann <eric.lippmann@netways.de>
     */
    Ext.ux.ingraph.icingaweb.ColumnRenderer = (function () {
        /**
         * Preview graph within a new window.
         */
        var Preview = function (e, el) {
                var row = this.grid.getView().findRowIndex(el),
                    rec;
                if (row !== false) {
                    rec = this.store.getAt(row);
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
            },
            /**
             * Preview graph within a new window.
             */
            preview = function () {
                var args = this.getHandlerArgsTemplated();
                Ext.ux.ingraph.icingaweb.Cronk.Window({
                    title: args.title,
                    host: args.host,
                    service: args.service,
                    start: args.preview.start ?
                            Math.ceil(strtotime(args.preview.start)) : '',
                    height: args.preview.height,
                    width: args.preview.width,
                    overview: args.preview.overview
                });
            },
            /**
             * Preview graph within a tooltip.
             */
            Popup = function (e, el) {
                var row = this.grid.getView().findRowIndex(el),
                    rec;
                if (row !== false) {
                    var rec = this.store.getAt(row);
                    Ext.ux.ingraph.icingaweb.Cronk.Popup({
                        title: new Ext.XTemplate(this.cfg.title).apply(rec.data),
                        host: rec.get(this.cfg.host),
                        service: rec.get(this.cfg.service),
                        start: this.cfg.popup.start ?
                                Math.ceil(strtotime(this.cfg.popup.start)) :  '',
                        height: this.cfg.popup.height,
                        width: this.cfg.popup.width,
                        target: e.getTarget(),
                        e: e,
                        iconCls: this.cfg.iconCls
                    });
                }
            },
            /**
             * Preview graph within a tooltip.
             */
            Popup2 = function (e, el, iconCls) {
                Ext.ux.ingraph.icingaweb.Cronk.Popup({
                    title: this.title,
                    host: this.host,
                    service: this.service,
                    start: this.popup.start ?
                            Math.ceil(strtotime(this.popup.start)) : '',
                    height: this.popup.height,
                    width: this.popup.width,
                    target: e.getTarget(),
                    e: e,
                    iconCls: iconCls
                });
            },
            /**
             * Preview graph within a tooltip.
             */
            popup = function (e, el) {
                var args = this.getHandlerArgsTemplated();
                if (!this.task) {
                    // Execute Popup with args as scope
                    this.task = new Ext.util.DelayedTask(Popup2, args);
                }
                this.task.delay(args.popup.timeout, null, null, [e, el, this.iconCls]);
            },
            /**
             * Cancel/clear graph tooltip.
             */
            disarm = function () {
                if (this.task) {
                    this.task.cancel();
                    this.task = null;
                }
            },
            /**
             * Grid's store load listener. Adds listeners for mouseover, mouseout
             * and click to all ingraph columns of the grid.
             */
            onLoad = function () {
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
            },
            popup: popup,
            preview: preview,
            disarm: disarm
        };
    }());
}());

(function () {
    'use strict';
    Ext.ns('Cronk.grid.ColumnRenderer');
    Cronk.grid.ColumnRenderer.iGColumn = function (cfg) {
        return function (value, metaData, record, rowIndex, colIndex, store) {
            if ('0' === record.get(cfg.hideIfZero)) {
                return '';
            }
            return Ext.DomHelper.markup({
                tag: 'div',
                cls: 'iGColumn icon-16 x-icinga-grid-link ' + cfg.iconCls,
                style: "width: 25px;height: 24px;display: block"
            });
        };
    };
}());

(function () {
    'use strict';
    if (Cronk.grid.events && Cronk.grid.events.EventMixin) {
        // Icinga-web > 1.8 only
        Ext.ns('Ext.ux.ingraph.icingaweb');
        Ext.ux.ingraph.icingaweb.GridIcon = Ext.extend(Ext.BoxComponent, {
            cls: 'icon-16 x-icinga-grid-link',
            style: {
                margin: '3px 0px'
            },
            afterRender: function () {
                this.el.addClass(this.iconCls);
                this.relayEvents(this.el, ['mouseover', 'mouseout', 'click']);
                this.initEventMixin(this);
                Ext.BoxComponent.prototype.afterRender.call(this);
            }
        });
        Ext.override(
            Ext.ux.ingraph.icingaweb.GridIcon,
            Cronk.grid.events.EventMixin
        );
        Ext.reg('igridicon', Ext.ux.ingraph.icingaweb.GridIcon);
    }
}());
