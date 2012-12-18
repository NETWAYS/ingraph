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
    var _format = String.format;
    String.format = function (format) {
        var newargs = [];
        Ext.each(Ext.toArray(arguments, 1), function (arg) {
            if (Ext.isObject(arg)) {
                /*
                 * Allow named arguments
                 */
                Ext.iterate(arg, function (key, value) {
                    format = format.replace(
                        new RegExp('\\{(' + key + ')\\}', 'gi'),
                        value
                    );
                });
            } else {
                newargs.push(arg);
            }
        });
        newargs.unshift(format);
        return _format.apply(this, newargs);
    };
}());
