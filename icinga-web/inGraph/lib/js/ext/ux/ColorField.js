(function () {
    "use strict";

    Ext.ux.ColorField = Ext.extend(Ext.form.TriggerField, {
        triggerClass: 'x-form-arrow-trigger',
        lazyInit: true,

        initComponent: function () {
            Ext.ux.ColorField.superclass.initComponent.call(this);
            this.addEvents(
                'select'
            );
        },

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

        isExpanded: function () {
            return this.menu && this.menu.isVisible();
        },

        onRender: function (ct, position) {
            Ext.ux.ColorField.superclass.onRender.call(this, ct, position);

            if (!this.lazyInit) {
                this.initMenu();
            } else {
                this.on('focus', this.initMenu, this, {single : true});
            }
        },

        onTriggerClick: function () {
            if (this.readOnly || this.disabled) {
                return;
            }

            this.menu.show(this.el, "tl-bl?");

//            this.el.focus();
//            this.onFocus();
        },

        onSelect: function (palette, color) {
            this.setValue('#' + color);
            this.fireEvent('select', this, color);
            this.menu.hide();
        },

        onMenuHide: function () {
        },

        validateBlur: function () {
            return !this.menu || !this.menu.isVisible();
        },

        beforeBlur: function () {
            var v = this.getRawValue();
            if (v) {
                this.setValue(v);
            }
        },

        setValue: function (v) {
            return Ext.ux.ColorField.superclass.setValue.call(this, v);
        },

        onDestroy: function () {
            if (this.menu) {
                this.menu.destroy();
            }
            Ext.ux.ColorField.superclass.onDestroy.call(this);
        },

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
