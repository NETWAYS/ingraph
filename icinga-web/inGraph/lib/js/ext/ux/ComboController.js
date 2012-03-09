/**
 * Ext.ux.ComboController
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
     * @class Ext.ux.ComboController
     * @extends Object
     * @namespace Ext.ux
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     */
    Ext.ux.ComboController = Ext.extend(Object, {
        constructor: function () {
            this.slaves = Array.prototype.slice.call(arguments, 0);
        },

        init: function (combo) {
            combo.on({
                scope: this,
                select: function (me) {
                    Ext.each(this.slaves, function (slave) {
                        var scope = Ext.isObject(slave) ? slave.scope :
                                    me.refOwner,
                            cmp = Ext.isObject(slave) ? scope[slave.ref] :
                                    scope[slave];

                        if (cmp) {
                            cmp.enable();
                            if (Ext.isFunction(cmp.clearValue)) {
                                cmp.clearValue();
                            }
                        }
                    }, this);
                },
                change: function (me, value) {
                    Ext.each(this.slaves, function (slave) {
                        var scope = Ext.isObject(slave) ? slave.scope :
                                    me.refOwner,
                            cmp = Ext.isObject(slave) ? scope[slave.ref] :
                                    scope[slave];

                        if (cmp) {
                            if (Ext.isFunction(cmp.clearValue)) {
                                cmp.clearValue();
                            }

                            if (value) {
                                cmp.enable();
                            } else {
                                cmp.disable();
                            }
                        }
                    }, this);
                }
            });
        }
    });
}());
