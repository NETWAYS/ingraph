/**
 * Ext.ux.wizard.Wizard
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.wizard.
 *
 * Ext.ux.wizard is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.wizard is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.wizard. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";
    Ext.ns('Ext.ux.wizard');
    /**
     * @author Eric Lippmann <eric.lippmann@netways.de>
     */
    Ext.ux.wizard.Wizard = Ext.extend(Ext.Panel, {
        layout:'card',
        activeItem: 0,
        defaults: {
            border:false
        },
        prevText: _('&lt; Previous'),
        nextText: _('Next &gt;'),
        lastText: _('Submit'),
        // private override
        initComponent: function () {
            var cfg = {};
            this.buildBbar(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.wizard.Wizard.superclass.initComponent.call(this);
        },
        // private
        buildBbar: function (cfg) {
            cfg.bbar = [
                '->',
                {
                    ref: '../prev',
                    text: this.prevText,
                    handler: this.navHandler.createDelegate(this, [-1]),
                    disabled: true
                },
                {
                    ref: '../next',
                    text: this.nextText,
                    handler: this.navHandler.createDelegate(this, [1])
                }
            ]
        },
        // private
        onLast: Ext.emptyFn,
        // private
        navHandler: function (positionOffset) {
            if (this.activeItem + positionOffset > this.items.length - 1) {
                this.onLast();
            } else {
                // TODO(el): validation
                this.activeItem += positionOffset;
                this.layout.setActiveItem(this.activeItem);
                if (this.activeItem === this.items.length -1) {
                    this.next.setText(this.lastText);
                    this.nextDirty = true;
                } else if (true === this.nextDirty) {
                    this.next.setText(this.nextText);
                    this.nextDirty = false;
                }
                if (this.activeItem === 0) {
                    this.prev.setDisabled(true);
                } else {
                    this.prev.setDisabled(false);
                }
            }
        },
        // private
        onBeforeAdd: function (item) {
            Ext.ux.wizard.Wizard.superclass.onBeforeAdd.call(this, item);
            item.on({
                activate: this.onCardShow.createDelegate(this),
                deactivate: this.onCardHide.createDelegate(this),
            });
        },
        // private
        onCardShow: function (card) {
            if (true === card.monitorValid) {
                card.on({
                    scope: this,
                    clientvalidation: this.onClientvalidation
                });
                this.next.setDisabled(true);
            }
        },
        // private
        onCardHide: function (card) {
            if (true === card.monitorValid) {
                card.un({
                    scope: this,
                    clientvalidation: this.onClientvalidation
                });
            }
        },
        // private
        onClientvalidation: function (card, isValid) {
            this.next.setDisabled(!isValid);
        }
    });
    Ext.reg('xwizard', Ext.ux.wizard.Wizard);
}());
