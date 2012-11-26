/**
 * Ext.ux.StoreFilter
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * Ext.ux.StoreFilter is licensed under the terms of the
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
    Ext.ns('Ext.ux');
    /**
     * @class Ext.ux.StoreFilter
     * @extends Object
     * @namespace Ext.ux
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object [, Object [, Object ...]]}
     */
    Ext.ux.StoreFilter = Ext.extend(Object, {
        constructor: function () {
            this.storesToFilter = Array.prototype.slice.call(arguments, 0);
        },
        // private override
        init: function (combo) {
            Ext.each(this.storesToFilter, function (cfg) {
                combo.on('change', function (field, newValue, oldValue) {
//                    if (newValue !== oldValue && combo.lastQuery) {
//                        delete combo.lastQuery;
//                    }
                    var selectedRecord = combo.getSelectedRecord();
                    if (selectedRecord) {
                        newValue = selectedRecord.get(combo.valueField);
                    } else {
                        newValue = '%' + newValue + '%';
                    }
                    cfg.store.baseParams[cfg.param] = newValue;
                    cfg.store.load();
                });
            });
        }
    });
}());
