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
    function qtippedFieldlabel (qtip, label) {
        return String.format(
            '<span ext:qtip="{0}">{1}</span>',
            qtip,
            label
        );
    }
    Ext.override(Ext.form.Field, {
        /**
         * @cfg {String} qtip
         */

        initComponent: Ext.form.Field.prototype.initComponent.createInterceptor(function () {
            if (this.fieldLabel && this.qtip) {
                this.fieldLabel = qtippedFieldlabel(
                    this.qtip,
                    this.fieldLabel
                );
            }
        })
    });
}());
