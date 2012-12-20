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
    Ext.ux.flot.AbstractStyleForm = Ext.extend(Ext.FormPanel, {
        /**
         * @cfg {Ext.data.Record} record
         * A {@link Ext.data.Record} to initialize this form with.
         */

        labelWidth: 100,
        defaults: {
            xtype: 'fieldset',
            collapsible: true
        },
        // private override
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.AbstractStyleForm.superclass.initComponent.call(this);
        },
        // private
        buildItems: Ext.emptyFn,
        // private override
        afterRender: function () {
            Ext.ux.flot.AbstractStyleForm.superclass.afterRender.call(this);
            // Load record once the form is ready
            if (this.record) {
                this.getForm().loadRecord(this.record);
            }
        }
    });
}());
