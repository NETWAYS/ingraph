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
    Ext.apply(Ext.form.VTypes, {
        /**
         * ## Example usage
         *
         *     @example
         *     new Ext.form.FormPanel({
         *         items: [
         *             {
         *                 fieldLabel: 'Start Date',
         *                 name: 'start',
         *                 id: 'start',
         *                 vtype: 'daterange',
         *                 endDateField: 'end',     // id of the end date field
         *                 ref: '../startDateField' // or ...
         *             },
         *             {
         *                 fieldLabel: 'End Date',
         *                 name: 'end',
         *                 id: 'end',
         *                 vtype: 'daterange',
         *                 startDateField: 'start', // id of the start date field
         *                 ref: '../endDateField    // or ...
         *             }
         *         ]
         *     });
         */
        daterange: function (value, field) {
            var date = field.parseDate(value),
                backup;
            if (!date) {
                return false;
            }
            // Ext modifies the date object somehow which breaks our strtotime usage
            backup = field.parseDate(value);
            if ((field.refName === 'endDateField' || field.startDateField) &&
                (!this.dateRangeMax || (date.getTime() != this.dateRangeMax.getTime()))
            ) {
                var start = field.refName === 'endDateField' ?
                        field.refOwner.startDateField :
                        field.up('form').down('#' + field.startDateField);
                start.setMaxValue(date);
                start.validate();
                this.dateRangeMax = backup;
            }
            else if ((field.refName === 'startDateField' || field.endDateField) &&
                     (!this.dateRangeMin || (date.getTime() != this.dateRangeMin.getTime()))
            ) {
                var end = field.refName === 'startDateField' ?
                        field.refOwner.endDateField :
                        field.up('form').down('#' + field.endDateField);
                end.setMinValue(date);
                end.validate();
                this.dateRangeMin = backup;
            }
            /*
             * Always return true since we're only using this vtype to set the
             * min/max allowed values (these are tested for after the vtype test)
             */
            return true;
        }
    });
}());
