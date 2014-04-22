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

/*global _, Ext */

(function () {
    'use strict';
    Ext.ns('Ext.ux.ingraph');
    Ext.ux.ingraph.AutoComboBox = Ext.extend(Ext.form.ComboBox, {
        minChars: 0,
        height: 30,
        pageSize: 20,
        width: 240,
        minListWidth: 240,
        triggerAction: 'all',
        hideTrigger: true,
        listEmptyText: _('No results...'),
        /**
         * The wildcard to prefix and suffix the query with.
         */
        wildcard: '*',
        // private override
        initComponent: function () {
            Ext.ux.ingraph.AutoComboBox.superclass.initComponent.call(this);
            // initComponent sets displayField if store is an array or a local
            // array store, thus we overwrite tpl afterwards
            this.overwriteDefaults();
        },
        // private
        overwriteDefaults: function () {
            if (!this.tpl) {
                this.tpl = String.format(
                    '<tpl for=".">' +
                        '<div ext:qtip="{{0}}" class="x-combo-list-item">{{0}}</div>' +
                        '</tpl>',
                    this.displayField
                );
            }
        },
        // private override
        initEvents: function () {
            Ext.ux.ingraph.AutoComboBox.superclass.initEvents.call(this);
            this.on({
                scope: this,
                beforequery: this.onBeforequery
            });
        },
        // private
        onBeforequery: function (queryEvent) {
            var q = queryEvent.query;
            // Prefix and or suffix query if necessary
            if (q.charAt(0) !== this.wildcard) {
                q = this.wildcard + q;
            }
            if (q.charAt(q.length - 1) !== this.wildcard) {
                q += this.wildcard;
            }
            // Write modified query back
            queryEvent.query = q;
        },
        // private override
        afterRender: function () {
            Ext.ux.ingraph.AutoComboBox.superclass.afterRender.call(this);
            this.el.on({
                scope: this,
                click: function () {
                    // Expand combo on element click, i.e. focus
                    this.doQuery('', true);
                }
            });
        },
        // public override
        getSelectedRecord: function () {
            return this.findRecord(this.valueField, this.getValue());
        }
    });
    Ext.reg('xigautocombo', Ext.ux.ingraph.AutoComboBox);
}());
