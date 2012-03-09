/**
 * Ext.ux.flot.PanelConfiguration
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

    Ext.ns('Ext.ux.flot.PanelConfiguration');

    /**
     * @class Ext.ux.flot.PanelConfiguration
     * @extends Ext.FormPanel
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Configuration panel for <tt>{@link Ext.ux.flot.Panel}</tt>.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotpanelconfig
     */
    Ext.ux.flot.PanelConfiguration = Ext.extend(Ext.FormPanel, {
        /**
         * @cfg {String} panelTitle
         */

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.PanelConfiguration.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            cfg.items = [
                {
                    fieldLabel: _('Title'),
                    xtype: 'textfield',
                    name: 'panelTitle',
                    enableKeyEvents: true,
                    anchor: '100%',
                    allowBlank: false,
                    value: this.panelTitle
                }
            ];
        }
    });
    Ext.reg('xflotpanelconfig', Ext.ux.flot.PanelConfiguration);
}());
