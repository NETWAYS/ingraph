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
    Ext.ux.flot.PanelSettingsWindow = Ext.extend(Ext.ux.flot.FormWindow, {
        title: _('Panel Settings'),
        width: 300,
        height: 105,
        /**
         * @cfg {Ext.ux.flot.Panel} flotPanel
         */

        // private override
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
            ];
        },
        // private override
        applyHandler: function () {
            var panelTitle = this.form.getForm().findField('panelTitle')
                    .getValue();
            this.flotPanel.initialConfig.title = panelTitle;
            this.flotPanel.xsetTitle(this.flotPanel.store.isEmpty());
        },
        // private override
        onShow: function () {
            this.items.get(0).items.get(0).focus('', 50);
        }
    });
}());
