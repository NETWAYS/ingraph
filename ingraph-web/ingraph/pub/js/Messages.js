(function () {
    "use strict";

    Ext.ux.Toast = (function () {
        var msgCt,
            createBox = function (t, s) {
                return [
                    '<div class="msg">',
                    '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
                    '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">' +
                        '<h3>', t, '</h3>', s, '</div></div></div>',
                    '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
                    '</div>'
                ].join('');
            };

        return {
            msg: function (title, format) {
                if (!msgCt) {
                    msgCt = Ext.DomHelper.insertFirst(document.body,
                        {
                            id: 'msg-div',
                            style: 'position:absolute; z-index:10000;'
                        },
                        true
                        );
                }
                var s = String.format.apply(String,
                                            Array.prototype.slice.call(arguments, 1)),
                    m = Ext.DomHelper.append(msgCt,
                        {
                            html: createBox(title, s)
                        },
                        true
                        );

                msgCt.alignTo(document, 'tr-tr');

                m.slideIn('t').pause(3).ghost('t',
                    {
                        remove: true
                    }
                    );
            }
        };

    }());

    var _storeConstructor = Ext.data.Store.prototype.constructor;
    Ext.override(Ext.data.Store, {
        constructor: function (cfg) {
            _storeConstructor.call(this, cfg);
            this.on({
                exception: function (proxy, type, action, options, response, arg) {
                    var resp = Ext.decode(response.responseText);
                    Ext.ux.Toast.msg(
                        _('Error'),
                        resp.errorMessage
                    );
                },
                scope: this
            });
        }
    });

    Ext.Ajax.on('requestexception', function (c, r) {
        var resp = Ext.decode(r.responseText);
        Ext.ux.Toast.msg(
            _('Error'),
            resp.errorMessage
        );
    });
}());
