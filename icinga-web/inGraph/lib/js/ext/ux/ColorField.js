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
    Ext.ux.ColorField = Ext.extend(Ext.form.TriggerField, {
        triggerClass: 'x-form-arrow-trigger',
        lazyInit: true,
        // private override
        initComponent: function () {
            Ext.ux.ColorField.superclass.initComponent.call(this);
            this.addEvents(
                'select'
            );
        },
        // private override
        initMenu: function () {
            if (!this.menu) {
                this.menu = new Ext.menu.ColorMenu({
                    hideOnClick : false
                });
                this.mon(this.menu, {
                    scope: this,
                    select: this.onSelect,
                    hide: this.onMenuHide
                });
            }
        },
        // private override
        isExpanded: function () {
            return this.menu && this.menu.isVisible();
        },
        // private override
        onRender: function (ct, position) {
            Ext.ux.ColorField.superclass.onRender.call(this, ct, position);
            if (!this.lazyInit) {
                this.initMenu();
            } else {
                this.on('focus', this.initMenu, this, {single: true});
            }
        },
        // private override
        onTriggerClick: function () {
            if (this.readOnly || this.disabled) {
                return;
            }
            this.menu.show(this.el, "tl-bl?");

//            this.el.focus();
//            this.onFocus();
        },
        // private override
        onSelect: function (palette, color) {
            this.setValue('#' + color);
            this.fireEvent('select', this, color);
            this.menu.hide();
        },
        // private override
        onMenuHide: function () {
        },
        // private override
        validateBlur: function () {
            return !this.menu || !this.menu.isVisible();
        },
        // private override
        beforeBlur: function () {
            var v = this.getRawValue();
            if (v) {
                this.setValue(v);
            }
        },
        // private override
        setValue: function (v) {
            return Ext.ux.ColorField.superclass.setValue.call(this, v);
        },
        // private override
        onDestroy: function () {
            if (this.menu) {
                this.menu.destroy();
            }
            Ext.ux.ColorField.superclass.onDestroy.call(this);
        },
        // private override
        getValue: function () {
            var v = Ext.ux.ColorField.superclass.getValue.call(this);
            // Ext returns '' on invalid / empty values
            if (v === '') {
                // Flot requires null for auto-detect
                return null;
            }
            return v;
        }
    });
    Ext.reg('xcolorfield', Ext.ux.ColorField);
}());
