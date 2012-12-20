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
    Ext.ns('Ext.ux.flot');
    Ext.ux.flot.NumberField = Ext.extend(Ext.form.NumberField, {
        /**
         * Returns the normalized data value. As opposed to the
         * Ext version which returns '' on undefined or emptyText
         * this one will return null since Flot requires that
         * for auto-setting the property later.
         * @return {Mixed} value The field value
         */
        getValue: function() {
            var v = Ext.ux.flot.NumberField.superclass.getValue.call(this);
            // Ext returns '' on invalid / empty values
            if (v === '') {
                // Flot requires null for auto-setting
                return null;
            }
            return v;
        }
    });
    Ext.reg('xflotnumberfield', Ext.ux.flot.NumberField);
}());