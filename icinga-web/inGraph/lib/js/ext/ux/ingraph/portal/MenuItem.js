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

/*global _, Ext */

(function () {
    'use strict';
    Ext.ns('Ext.ux.ingraph.portal');
    Ext.ux.ingraph.portal.MenuItem = Ext.extend(Ext.Container, {
        /**
         * @hide
         */
        cls: 'x-ingraph-portal-item',
        /**
         * @hide
         */
        layout: 'hbox',
        /**
         * @hide
         */
        layoutConfig: {
            align: 'middle',
            pack: 'center'
        },
        // private override
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.portal.MenuItem.superclass.initComponent.call(this);
        },
        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'box',
                    autoEl: {
                        tag: 'div',
                        cls: 'ingraph-logo',
                        style: 'height: 65px; width: 190px; cursor:pointer;'
                    },
                    listeners: {
                        single: true,
                        scope: this,
                        afterrender: function (ct) {
                            ct.el.on({
                                scope: this,
                                click: function (e, el) {
                                    var menu = new Ext.ux.ingraph.Menu(),
                                        menuWindow = new Ext.Window({
                                            title: 'inGraph',
                                            modal: true,
                                            items: menu
                                        });
                                    menu.on('plot', function (cb, cfg) {
                                        cfg.xtype = 'xigportalview';
                                        cfg.credentials = this.credentials,
                                        this.replaceWith(cfg);
                                        menuWindow.destroy();
                                    }, this);
                                    menuWindow.show();
                                },
                                contextmenu: function (e) {
                                    e.stopEvent();
                                    var contextMenu = new Ext.menu.Menu({
                                        items: [
                                            {
                                                text: _('Hide'),
                                                // TODO(el): iconCls
//                                                iconCls: '',
                                                scope: this,
                                                handler: function () {
                                                    var cfg = {
                                                        xtype: 'xigportalplaceholder',
                                                        getState: function () {
                                                            return {
                                                                xtype: this.getXType()
                                                            };
                                                        }
                                                    };
                                                    this.replaceWith(cfg);
                                                }
                                            }
                                        ]
                                    });
                                    contextMenu.showAt(e.getXY());
                                }
                            });
                        }
                    }
                }
            ];
        },
        // private
        replaceWith: function (cfg) {
            cfg = cfg || {};
            var rowCt = this.ownerCt;
            rowCt.items.each(function (column, columnIndex) {
                if (column === this) {
                    rowCt.remove(column); // Destroys this
                    Ext.apply(cfg, {
                        row: column.row,
                        flex: column.flex,
                        rowHeight: column.rowHeight,
                        credentials: this.credentials
                    });
                    rowCt.insert(columnIndex, cfg);
                    rowCt.doLayout();
                    // Break
                    return false;
                }
            }, this);
        },
        /**
         * Returns this component's state.
         * @return {Object}
         */
        getState: function () {
            return {
                xtype: this.getXType()
            };
        }
    });
    Ext.reg('xigportalmenuitem', Ext.ux.ingraph.portal.MenuItem);
}());
