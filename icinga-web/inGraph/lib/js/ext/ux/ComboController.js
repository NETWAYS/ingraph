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
    Ext.ux.ComboController = Ext.extend(Object, {
        // private override
        constructor: function () {
            this.slaves = Array.prototype.slice.call(arguments, 0);
        },
        // private
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
