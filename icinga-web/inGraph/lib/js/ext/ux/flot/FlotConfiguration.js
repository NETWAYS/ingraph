/**
 * Ext.ux.flot.FlotConfiguration
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
     * @class Ext.ux.flot.FlotConfiguration
     * @extends Ext.TabPanel
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Configuration panel for <tt>{@link Ext.ux.flot.Template}</tt>.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotconfig
     */
    Ext.ux.flot.FlotConfiguration = Ext.extend(Ext.TabPanel, {

        /**
         * @cfg {Ext.data.Store} store
         */

        activeTab: 0,

        // private
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.FlotConfiguration.superclass.initComponent.call(this);
        },

        // private
        buildItems: function (cfg) {
            var items = [
                {
                    title: _('Series'),
                    xtype: 'xflotseriesconfig',
                    store: this.store
                },
                {
                    title: _('Axes'),
                    xtype: 'xflotaxesconfig',
                    store: this.store.yaxes
                }
            ];

            cfg.items = items;
        }
    });
    Ext.reg('xflotconfig', Ext.ux.flot.FlotConfiguration);
}());
