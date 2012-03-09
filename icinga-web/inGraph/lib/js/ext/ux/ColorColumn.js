/**
 * Ext.ux.grid.ColorColumn
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * Ext.ux.grid.ColorColumn is licensed under the terms of the
 *             GNU Open Source GPL 3.0
 * license.
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

    Ext.ns('Ext.ux.grid');

    /**
     * @class Ext.ux.grid.ColorColumn
     * @extends Ext.grid.TemplateColumn
     * @namespace Ext.ux.grid
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Render a colored rectangle before text.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xcolorcolumn
     */
    Ext.ux.grid.ColorColumn = Ext.extend(Ext.grid.TemplateColumn, {
        /**
         * @cfg {Ext.Xtemplate} tpl
         * @hide
         */
        tpl: new Ext.XTemplate(
            '<tpl if="values.color">',
            '<span style="background:{color}; float:left;display: block;' +
                'height: 10px;line-height: 10px; width: 10px;' +
                'border: 1px solid #666;" unselectable="on">&#160;</span>' +
                '<span style="padding:2px;">{color}</span>' +
                '</tpl>',
            {
                    compiled: true,
                    disableFormates: true
                }
        )
    });
    Ext.grid.Column.types.xcolorcolumn = Ext.ux.grid.ColorColumn;
}());
