/*
 * Plug export functionality
 */

(function () {
    'use strict';
    var download = function (url, args) {
        // Submits a form within a hidden iframe
        var body = Ext.getBody(),
            frame = body.createChild({
                tag: 'iframe',
                cls: 'x-hidden'
            }),
            form = body.createChild({
                tag: 'form',
                cls: 'x-hidden',
                action: url,
                method: 'POST',
                children: (function () {
                    var inputFields = [];
                    Ext.iterate(args, function (name, value) {
                        inputFields.push({
                            type: 'text',
                            tag: 'input',
                            cls: 'x-hidden',
                            name: name,
                            value: value
                        });
                    });
                    return inputFields;
                }())
            });
        frame.appendChild(form);
        form.dom.submit();
        Ext.destroy(form, frame);
    };
    Ext.override(Ext.ux.flot.Tbar, {
        doDownload: function (ot) {
            switch (ot.toLowerCase()) {
                case 'png':
                    break;
                default:
                    download(this.store.url + '.' + ot, {
                        start: this.store.getStartX(),
                        end: this.store.getEndX(),
                        query: Ext.util.Format.htmlEncode(this.store.getQuery())
                    });
                    break;
            }
        }
    });
}());
