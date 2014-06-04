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

/*global $, Ext */

(function () {
    'use strict';
    Ext.ns('Ext.ux.ingraph.portal');
    Ext.ux.ingraph.portal.Portal = Ext.extend(Ext.Container, {
        /**
         * @hide
         */
        layout: 'anchor',
        /**
         * @hide
         */
        autoScroll: true,
        style: {
            paddingBottom: '5px'
        },
        /**
         * Internal defaults for rows
         * @hide
         */
        defaults: {
            xtype: 'container',
            layout: 'hbox',
            height: 250,
            style: {
                marginTop: '5px',
                marginLeft: '5px'
            },
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                defaultMargins: '0 5 0 0'
            }
        },
        // private override
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
                        height: item.rowHeight,
                        items: []
                    });
                }
                item.credentials = this.credentials;
                rows[rowIndex - 1].items.push(item);
            }, this);
            return rows;
        },
        /**
         * Returns this component's state.
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
                    Ext.copyTo(state, column, ['row', 'flex', 'rowHeight']);
                    columns.push(state);
                });
            });
            return {
                columns: columns
            };
        },
        /**
         * Applies state to this component.
         * @param {Object} state
         */
        applyState: function (state) {
            state = $.extend(true, {}, state);
            this.add(this.prepareColumns(state.columns));
        }
    });
    Ext.reg('xigportal', Ext.ux.ingraph.portal.Portal);
}());
