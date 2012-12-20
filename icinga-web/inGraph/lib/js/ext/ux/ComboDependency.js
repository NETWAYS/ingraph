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
    Ext.ns('Ext.ux');
    Ext.ux.ComboDependency = Ext.extend(Object, {
        // private override
        constructor: function () {
            this.dependencies = Array.prototype.slice.call(arguments, 0);
        },
        // private
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
                                    if (selectedRecord) {
                                        options.params[param] = selectedRecord.get(param);
                                    } else if (Ext.isFunction(dependency.callback)) {
                                        options.params[param] = '%' + cmp.getValue() + '%';
                                    }
                                });
                            } else {
                                if (selectedRecord) {
                                    options.params[dependency.param] = selectedRecord.get(dependency.param);
                                } else if (Ext.isFunction(dependency.callback)) {
                                    options.params[dependency.param] = '%' + cmp.getValue() + '%';
                                }
                            }
                        }
                    }, this);
                }
            });
        }
    });
}());
