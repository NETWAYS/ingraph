/**
 * Ext.ux.ComboDependency
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

    Ext.ns('Ext.ux');

    /**
     * @class Ext.ux.ComboDependency
     * @extends Object
     * @namespace Ext.ux
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object [, Object [, Object ...]]}
     */
    Ext.ux.ComboDependency = Ext.extend(Object, {
        constructor: function () {
            this.dependencies = Array.prototype.slice.call(arguments, 0);
        },

        init: function (combo) {
            combo.on({
                scope: this,
                single: true,
                afterrender: function (me) {
                    Ext.each(this.dependencies, function (dependency) {
                        var scope = dependency.scope || me.refOwner,
                            cmp = scope[dependency.ref];

                        if (cmp) {
                            cmp.on({
                                change: function (field, newValue, oldValue) {
                                    if (newValue !== oldValue && me.lastQuery) {
                                        delete me.lastQuery;
                                    }
                                }
                            });
                        }
                    });
                }
            });

            combo.getStore().on({
                scope: this,
                beforeload: function (store, options) {
                    Ext.each(this.dependencies, function (dependency) {
                        var scope = dependency.scope || combo.refOwner,
                            cmp = scope[dependency.ref],
                            selectedRecord = cmp.getSelectedRecord();

                        if (cmp) {
                            if (Ext.isArray(dependency.param)) {
                                Ext.each(dependency.param, function (param) {
                                    options.params[param] = selectedRecord.get(param);
                                });
                            } else {
                                options.params[dependency.param] = selectedRecord.get(dependency.param);
                            }
                        }
                    }, this);
                }
            });
        }
    });
}());
