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

/*global Ext */

(function () {
    'use strict';
    Ext.ns('Ext.ux.ingraph.portal');
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
                hidden: true
            },
            // Do not render any tools
            tools: []
        },
        // private override
        buildTools: function (cfg) {
            cfg.tools = [
                {
                    id: 'minus',
                    scope: this,
                    handler: function () {
                        this.items.each(function (panel) {
                            var tbar = panel.getTopToolbar();
                            tbar.setVisible(tbar.hidden);
                        }, this);
                    }
                },
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
                    // Break
                    return false;
                }
            }, this);
        },
        // private override
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
