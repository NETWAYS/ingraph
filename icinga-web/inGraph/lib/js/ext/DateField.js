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

/*global Ext, strtotime */

(function () {
    'use strict';
    var _parseDate = Ext.form.DateField.prototype.parseDate;
    Ext.override(Ext.form.DateField, {
        parseDate: function (value) {
            var date = _parseDate.call(this, value),
                t;
            if (!date) {
                // Try strtotime if the original parse fails
                t = strtotime(value);
                if (t !== false) {
                    this.strValue = value;
                    t = Math.ceil(t * 1000);
                    return new Date(t);
                }
                return '';
            }
            return date;
        }
    });
}());
