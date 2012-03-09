/**
 * Ext.ux.flot.PanelSettingsWindow
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.flot.
 *
 * Ext.ux.flot is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.flot is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.flot. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.flot');

    /**
     * @class Ext.ux.flot.PanelSettingsWindow
     * @extends Ext.ux.flot.FormWindow
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     */
    Ext.ux.flot.PanelSettingsWindow = Ext.extend(Ext.ux.flot.FormWindow, {
        title: _('Panel Settings'),

        width: 300,

        height: 105,

        /**
         * @cfg {Ext.ux.flot.Panel} flotPanel
         */

        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'xflotpanelconfig',
                    layout: 'form',
                    ref: 'form',
                    baseCls: 'x-plain',
                    labelWidth: 40,
                    panelTitle: this.flotPanel.initialConfig.title,
                    monitorValid: true
                }
            ]; // Eof items
        },

        applyHandler: function () {
            var panelTitle = this.form.findField('panelTitle').getValue();

            this.flotPanel.initialConfig.title = panelTitle;
            this.flotPanel.xsetTitle(this.flotPanel.store.isEmpty());
        },

        // private
        onShow: function () {
            this.items.get(0).items.get(0).focus('', 50);
        }
    });
}());
