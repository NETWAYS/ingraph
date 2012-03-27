/**
 * Ext.ux.ingraph.portal.Portal
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

    Ext.ns('Ext.ux.ingraph.portal');

    /**
     * @class Ext.ux.ingraph.portal.Portal
     * @extends Ext.Panel
     * @namespace Ext.ux.ingraph.portal
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigportal
     */
    Ext.ux.ingraph.portal.Portal = Ext.extend(Ext.Panel, {
        /**
         * @cfg {Object} layout
         * @hide
         */
        layout: 'vbox',

        /**
         * @cfg {Object} layoutConfig
         * @hide
         */
        layoutConfig: {
            align: 'stretch',
            pack: 'start',
            defaultMargins: '5 0 5 5'
        },

        /**
         * @cfg {Object} defaults
         * Internal defaults for rows.
         * @hide
         */
        defaults: {
            xtype: 'container',
            layout: 'hbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                defaultMargins: '0 5 0 0'
            },
            flex: 1
        },

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.portal.Portal.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            cfg.items = this.prepareColumns(this.items);
        },

        // private
        prepareColumns: function (items) {
            var rows = [];

            Ext.each(items, function (item) {
                var rowIndex = item.row;

                if (rowIndex > rows.length) {
                    rows.push({
                        items: []
                    });
                }

                rows[rowIndex - 1].items.push(item);
            });

            return rows;
        },

        /**
         * Get this component's state.
         * @method getState
         * @return {Object}
         */
        getState: function () {
            // Collect state of each child item. This is either a view, a
            // portalmenuitem or an empty container
            var columns = [];
            this.items.each(function (row) {
                row.items.each(function (column) {
                    var state = column.getState();
                    // Grab position of column
                    Ext.copyTo(state, column, ['row', 'flex']);
                    columns.push(state);
                });
            });

            return {
                columns: columns
            };
        },

        /**
         * Apply state to this component.
         * @method applyState
         * @param {Object} state
         */
        applyState: function (state) {
            state = $.extend(true, {}, state);
            var items = this.prepareColumns(state.columns);
            this.add(items);
        }
    });
    Ext.reg('xigportal', Ext.ux.ingraph.portal.Portal);
}());
