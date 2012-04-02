/**
 * Ext.ux.ingraph.portal.View
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
     * @class Ext.ux.ingraph.portal.View
     * @extends Ext.ux.ingraph.View
     * @namespace Ext.ux.ingraph.portal
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigportalview
     */
    Ext.ux.ingraph.portal.View = Ext.extend(Ext.ux.ingraph.View, {
        baseCls: 'x-panel',

        bodyBorder: false,

        layout: 'anchor',
        layoutConfig: {
            defaultAnchor: '100% 100%'
        },

        tbarConfig: {
            enable: false
        },

        panelConfig: {
            tbarConfig: {
                enable: false
            },
            // Do not render any tools
            tools: []
        },

        // private
        buildTools: function (cfg) {
            cfg.tools = [
                {
                    id: 'close',
                    scope: this,
                    handler: this.replaceWithMenuItem
                },
                {
                    id: 'refresh',
                    scope: this,
                    handler: function () {
                        this.removeAll(true);
                        if (this.view) {
                            this.view = this.view.name;
                            this.fromView();
                        } else {
                            this.template = this.template.name;
                            this.fromHostService();
                        }
                    }
                }
            ];
        },

        // private
        replaceWithMenuItem: function () {
            var rowCt = this.ownerCt;

            rowCt.items.each(function (column, columnIndex) {
                if (column === this) {
                    rowCt.remove(column); // Destroys this

                    var cfg = {
                        row: column.row,
                        flex: column.flex,
                        rowHeight: column.rowHeight,
                        xtype: 'xigportalmenuitem'
                    };

                    rowCt.insert(columnIndex, cfg);
                    rowCt.doLayout();

                    // Stop iteration
                    return false;
                }
            }, this);
        },

        // private
        onBeforeAdd: function (item) {
            Ext.ux.ingraph.portal.View.superclass.onBeforeAdd.call(this, item);
            if (item.title === this.title) {
                item.elements = item.elements.replace(',header', '');
                item.showEmpty = true;
                item.header = false;
            }
        }
    });
    Ext.reg('xigportalview', Ext.ux.ingraph.portal.View);
}());
