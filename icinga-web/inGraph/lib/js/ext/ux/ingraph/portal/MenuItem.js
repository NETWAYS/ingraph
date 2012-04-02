/**
 * Ext.ux.ingraph.portal.MenuItem
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
     * @class Ext.ux.ingraph.portal.MenuItem
     * @extends Ext.Container
     * @namespace Ext.ux.ingraph.portal
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigportalmenuitem
     */
    Ext.ux.ingraph.portal.MenuItem = Ext.extend(Ext.Container, {
       /**
        * @cfg {String} cls
        * Extra CSS class. Defaults to <tt>xingraph-portal-item</tt>.
        */
        cls: 'xingraph-portal-item',

        /**
         * @cfg {Object} layout
         * @hide
         */
        layout: 'hbox',

        /**
         * @cfg {Object} layoutConfig
         * @hide
         */
        layoutConfig: {
            align: 'middle',
            pack: 'center'
        },

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.portal.MenuItem.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            var items = [
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
            ]; // Eof items

            cfg.items = items;
        },

        replaceWith: function (cfg) {
            cfg = cfg || {};

            var rowCt = this.ownerCt;

            rowCt.items.each(function (column, columnIndex) {
                if (column === this) {
                    rowCt.remove(column); // Destroys this

                    Ext.apply(cfg, {
                        row: column.row,
                        flex: column.flex,
                        rowHeight: column.rowHeight
                    });

                    rowCt.insert(columnIndex, cfg);
                    rowCt.doLayout();

                    // Stop iteration
                    return false;
                }
            }, this);
        },

        /**
         * Get this component's state.
         * @method getState
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
