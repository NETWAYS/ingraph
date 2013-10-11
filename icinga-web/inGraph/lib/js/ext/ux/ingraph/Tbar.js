/*
 * Plug export functionality
 */

(function () {
    "use strict";

    Ext.override(Ext.ux.flot.Tbar, {
        doDownload: function (ot) {
            // Submit a form within a hidden iframe
            var body = Ext.getBody(),

                frame = body.createChild({
                    tag: 'iframe',
                    cls: 'x-hidden'
                }),

                form = body.createChild({
                    tag: 'form',
                    cls: 'x-hidden',
                    action: this.store.url + '.' + ot,
                    method: 'POST',
                    children: [
                        {
                            type: 'text',
                            tag: 'input',
                            cls: 'x-hidden',
                            name: 'startx',
                            value: this.store.getStartX()
                        },
                        {
                            type: 'text',
                            tag: 'input',
                            cls: 'x-hidden',
                            name: 'endx',
                            value: this.store.getEndX()
                        },
                        {
                            type: 'text',
                            tag: 'input',
                            cls: 'x-hidden',
                            name: 'query',
                            value: Ext.util.Format.htmlEncode(this.store.getQuery())
                        }
                    ]
                });

            frame.appendChild(form);

            form.dom.submit();

            Ext.destroy(form, frame);
        }
    });
}());
