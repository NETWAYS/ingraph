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
    Ext.ns('Ext.ux.flot');
    /**
     * Base class for Windows containing only one direct child item, the form.
     * @author Eric Lippmann <eric.lippmann@netways.de>
     */
    Ext.ux.flot.FormWindow = Ext.extend(Ext.Window, {
        // Expect only one direct child item (the form)
        layout: 'fit',
        collapsible: true,
        modal: true,
        bodyStyle: 'padding: 5px;',
        // private override
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            this.buildButtons(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.FormWindow.superclass.initComponent.call(this);
            this.addEvents(
                /**
                 * @event apply
                 * Fires after clicking the apply button.
                 * @param {Ext.ux.flot.FormWindow} this
                 * @param {Object} values
                 * Form values by default or custom implementation via
                 * {@link #getValues}.
                 */
                'apply'
            );
        },
        // private override
        onBeforeAdd: function (item) {
            Ext.ux.flot.FormWindow.superclass.onBeforeAdd.call(this, item);
            if (true === item.monitorValid) {
                item.on({
                    clientvalidation: function (form, valid) {
                        // form -> window -> ref of applyBtn
                        form.ownerCt.applyBtn.setDisabled(!valid);
                    }
                });
            }
        },
        /**
         * Overwrite this method to add items to the window.
         * Function body may contain for example:
         * <pre><code>
         * cfg.items = [
         *     {
         *         xtype: 'form',
         *         // Default implementation of getValues relies on this
         *         // reference
         *         ref: 'form',
         *         items: [
         *             {
         *                 ...
         *             }
         *         ]
         *     }
         * ];
         * return cfg;
         * </code></pre>
         * @param {Object} cfg
         * A config object applied to this and this' initialConfig later
         * @private
         */
        buildItems: Ext.emptyFn,
        // private
        buildButtons: function (cfg) {
            var buttons = [
                {
                    text: _('Apply'),
                    // bbar -> window
                    ref: '../applyBtn',
                    iconCls: 'x-flot-accept-icon',
                    scope: this,
                    handler: function () {
                        this.applyHandler();
                        this.onApply();
                    }
                },
                {
                    text: _('Cancel'),
                    iconCls: 'x-flot-cancel-icon',
                    scope: this,
                    handler: function () {
                        this.cancelHandler();
                        this.onCancel();
                    }
                }
            ];
            var userButtons = this.buttons;
            if (Ext.isArray(userButtons)) {
                if (this.prependButtons) {
                    buttons = userButtons.concat(buttons);
                } else {
                    buttons = buttons.concat(userButtons);
                }
            }
            delete this.buttons;
            cfg.buttons = buttons;
        },
        /**
         * Gets values of the wrapped form.
         * @return {Objecŧ} values
         * The form values
         */
        getValues: function () {
            return this.form.getForm().getFieldValues();
        },
        // private
        applyHandler: Ext.emptyFn,
        // private
        onApply: function () {
            this.fireEvent('apply', this, this.getValues());
            // Hide or destroy this based on config/hideMode
            this[this.closeAction]();
        },
        // private
        cancelHandler: Ext.emptyFn,
        // private
        onCancel: function () {
            // Hide or destroy this based on config/hideMode
            this[this.closeAction]();
        }
    });
    Ext.reg('xflotformwindow', Ext.ux.flot.FormWindow);
}());
