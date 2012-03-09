/**
 * Ext.ux.ingraph.AutoComboBox
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.ingraph.
 *
 * Ext.ux.ingraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.ingraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.ingraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph');

    /**
     * @class Ext.ux.ingraph.AutoComboBox
     * @extends Ext.form.ComboBox
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigautocombo
     */
    Ext.ux.ingraph.AutoComboBox = Ext.extend(Ext.form.ComboBox, {
        /**
         * @cfg {Number} minChars
         * The minimum number of characters the user must type before
         * autocomplete and {@link #typeAhead} activate. Defaults to <tt>0</tt>.
         */
        minChars: 0,

        height: 30,

        pageSize: 20,

        width: 240,
        minListWidth: 240,

        triggerAction: 'all',

        /**
         * @cfg {Boolean} hideTrigger
         * <tt>false</tt> to show the trigger element. By default only the base text
         * field is shown.
         */
        hideTrigger: true,

        /**
         * @cfg {String} listEmptyText
         * The empty text to display in the data view if no items are found.
         * Defaults to <tt>'No results...'</tt>.
         */
        listEmptyText: _('No results...'),

        /**
         * @cfg {String} wildcard
         * The wildcard to prefix and suffix the query with.
         * Defaults to <tt>'%'</tt>.
         */
        wildcard: '%',

        // private
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

        // private
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

        // private
        afterRender: function () {
            Ext.ux.ingraph.AutoComboBox.superclass.afterRender.call(this);

            this.el.on({
                scope: this,
                click: function () {
                    // Expand combo on element click, i.e. focus
                    this.doQuery('', true);
                }
            });
        }
    });
    Ext.reg('xigautocombo', Ext.ux.ingraph.AutoComboBox);
}());
