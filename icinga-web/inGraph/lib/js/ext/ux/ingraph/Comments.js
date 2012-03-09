/**
 * Ext.ux.ingraph.Comments
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.ingraph.
 *
 * Ext.ux.ingraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.ingraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.ingraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph.comments');

    Ext.ux.ingraph.comments.CommentMgr = (function () {
        var comments = [];
        return {
            register: function (id, el) {
                comments.push({
                    id: id,
                    ref: el
                });
            },
            unregister: function (id) {
                var i = 0,
                    c;
                for (i = 0; i < comments.length; ++i) {
                    c = comments[i];
                    if (id === c.id) {
                        Ext.destroy(c.ref);
                    }
                }
            }
        };
    }());

    Ext.ux.ingraph.comments.CommentFormWindow = Ext.extend(Ext.Window, {
        /**
         * @cfg {Ext.ux.flot.Flot} flot
         */

        layout: 'fit',

        width: 300,

        height: 230,

        bodyStyle: 'padding: 5px;',

        collapsible: true,

        modal: true,

        title: _('Comment'),

        waitMsg: _('Saving...'),

        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            this.buildButtons(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.comments.CommentFormWindow.superclass.initComponent.call(this);
        },

        buildItems: function (cfg) {
            cfg.items = [
                {
                    xtype: 'form',
                    ref: 'form',
                    baseCls: 'x-plain',
                    labelWidth: 60,
                    monitorValid: true,

                    defaults: {
                        xtype: 'combo',
                        width: 210
                    },

                    items: [
                        {
                            xtype: 'xdatetime',
                            fieldLabel: _('Date'),
                            dateConfig: {
                                value: new Date(this.comment_timestamp),
                                minValue: this.minDate,
                                maxValue: this.maxDate
                            },
                            timeConfig: {
                                value: new Date(this.comment_timestamp),
                                minValue: this.minDate,
                                maxValue: this.maxDate
                            },
                            ref: 'dateCmp',
                            submitValue: false
                        },
                        {
                            fieldLabel: _('Host'),
                            store: this.hosts,
                            value: this.comment_host,
                            name: 'host',
                            ref: 'hostCmp'
                        },
                        {
                            fieldLabel: _('Service'),
                            store: this.services,
                            value: this.comment_service,
                            name: 'service',
                            ref: 'serviceCmp'
                        },
                        {
                            xtype: 'textarea',
                            fieldLabel: _('Comment'),
                            name: 'comment',
                            value: this.comment_text,
                            allowBlank: false,
                            height: 70,
                            ref: 'commentCmp'
                        }
                    ]
                }
            ];
        },

        buildButtons: function (cfg) {
            var buttons = [
                {
                    text: _('Save'),
                    // bbar -> window
                    ref: '../saveBtn',
                    iconCls: 'xflot-icon-save',
                    scope: this,
                    handler: this.saveHandler
                },
                {
                    text: _('Cancel'),
                    iconCls: 'xflot-icon-cancel',
                    scope: this,
                    handler: this.cancelHandler
                }
            ];

            if (this.comment_id !== undefined) {
                buttons.splice(1, 0, {
                    text: _('Delete'),
                    iconCls: 'xflot-icon-delete',
                    scope: this,
                    handler: this.deleteHandler
                });
            }

            cfg.buttons = buttons;
        },

        // private
        onBeforeAdd: function (item) {
            Ext.ux.ingraph.comments.CommentFormWindow.superclass.onBeforeAdd.call(this, item);

            if (true === item.monitorValid) {
                item.on({
                    clientvalidation: function (form, valid) {
                        // form -> window -> ref of saveBtn
                        var saveBtn = form.ownerCt.saveBtn;

                        saveBtn.setDisabled(!valid);
                    }
                });
            }
        },

        onLayout: function () {
            Ext.ux.ingraph.comments.CommentFormWindow.superclass.onLayout.apply(this, arguments);
            // Fix missing 'submitValue' config option
            // of saki's DateTime extension.
            if (this.form.dateCmp.submitValue === false) {
                this.form.dateCmp.el.dom.removeAttribute('name');
            }
        },

        handleFailure: function (me, action) {
            var error = action.response.status + ' - ' + action.response.statusText;

            Ext.Msg.show({
                title: _('Error'),
                msg: error,
                modal: true,
                icon: Ext.Msg.ERROR,
                buttons: Ext.Msg.OK
            });
        },

        saveHandler: function () {
            this.form.dateCmp.updateDate();
            this.form.dateCmp.updateTime();

            var params = {
                timestamp: Math.floor(this.form.dateCmp.getValue().getTime() / 1000)
            };

            var url;
            if (this.comment_id !== undefined) {
                params.id = this.comment_id;
                url = Ext.ux.ingraph.Urls.comments.update;
            } else {
                url = Ext.ux.ingraph.Urls.comments.create;
            }

            this.form.getForm().submit({
                url: url,
                scope: this,
                success: this.onSave,
                failure: this.handleFailure,
                params: params,
                waitMsg: this.waitMsg
            });
        },

        onSave: function () {
            this.flot.store.reload();

            // Hide or destroy this based on config/hideMode
            this[this.closeAction]();
        },

        deleteHandler: function () {
            // Submit a form within a hidden iframe
            var body = Ext.getBody(),

                frame = body.createChild({
                    tag: 'iframe',
                    cls: 'x-hidden'
                }),

                form = body.createChild({
                    tag: 'form',
                    cls: 'x-hidden',
                    children: [
                        {
                            tag: 'input',
                            cls: 'x-hidden',
                            name: 'id',
                            value: this.comment_id
                        }
                    ]
                }),

                basicForm = new Ext.form.BasicForm(form);

            frame.appendChild(form);

            Ext.each(form.query('input'), function (inputEl) {
                var field = new Ext.form.TextField({
                    applyTo: inputEl
                });
                basicForm.add(field);
            });

            basicForm.submit({
                url: Ext.ux.ingraph.Urls.comments.remove,
                method: 'POST',
                waitMsg: _('Deleting'),
                scope: this,
                success: this.onDelete,
                failure: this.handleFailure,
                callback: function () {
                    Ext.destroy(basicForm, form, frame);
                }
            });
        },

        onDelete: function () {
            Ext.ux.ingraph.comments.CommentMgr.unregister(this.comment_id);

            // Hide or destroy this based on config/hideMode
            this[this.closeAction]();
        },

        cancelHandler: function () {
            // Hide or destroy this based on config/hideMode
            this[this.closeAction]();
        }
    });

    Ext.override(Ext.ux.flot.Tbar, {
        showComments: true,

        commentsHandler: function (btn) {
            var tip = new Ext.ToolTip({
                title: _('Comments'),
                renderTo: Ext.getBody(),
                anchor: 'left',
                target: btn.el,
                html: _('Trigger comment dialog by clicking the plot.'),
                listeners: {
                    hide: function (me) {
                        me.destroy.createDelegate(me, [], 1000);
                    }
                }
            });

            tip.show();

            this.ownerCt.flot.commentCtxEnabled = true;
        }
    });

    Ext.override(Ext.ux.flot.Flot, {
        onPlotclick: function (item, pos) {
            if (this.commentCtxEnabled === true) {
                var hosts = [],
                    services = [];
                this.store.getHostsAndServices(hosts, services);

                var cfg = {
                    flot: this,
                    minDate: new Date(this.store.getStartX() * 1000),
                    maxDate: new Date(this.store.getEndX() * 1000),
                    hosts: hosts,
                    services: services
                };

                if (item) {
                    Ext.apply(cfg, {
                        comment_host: item.series.host,
                        comment_service: item.series.service,
                        comment_timestamp: item.datapoint[0]
                    });
                } else {
                    Ext.apply(cfg, {
                        comment_host: hosts[0],
                        comment_service: services[0],
                        comment_timestamp: pos.x
                    });
                }

                var cfw = new Ext.ux.ingraph.comments.CommentFormWindow(cfg);

                cfw.show();

                this.commentCtxEnabled = false;
            }
        },

        annotate: function () {
            var yaxis = this.$plot.getYAxes()[0],
                y = (yaxis.min + yaxis.max) * 0.75;

            Ext.each(this.store.getComments(), function (comment) {
                var o = this.$plot.pointOffset({
                        x: comment.timestamp * 1000,
                        y: y
                    }),
                    el = this.el.createChild({
                        tag: 'img',
                        src: 'images/icons/balloon-ellipsis.png',
                        style: {
                            position: 'absolute',
                            left: o.left + 'px',
                            top: o.top + 'px',
                            cursor: 'pointer'
                        }
                    });

                Ext.ux.ingraph.comments.CommentMgr.register(comment.id, el);

                el.on({
                    scope: this,
                    click: function () {
                        var hosts = [],
                            services = [];
                        this.store.getHostsAndServices(hosts, services);

                        var cfg = {
                            flot: this,
                            minDate: new Date(this.store.getStartX() * 1000),
                            maxDate: new Date(this.store.getEndX() * 1000),
                            hosts: hosts,
                            services : services,
                            comment_id: comment.id,
                            comment_host: comment.host,
                            comment_service: comment.service,
                            comment_timestamp: comment.timestamp * 1000,
                            comment_text: comment.text
                        };

                        var cfw = new Ext.ux.ingraph.comments.CommentFormWindow(cfg);

                        cfw.show();
                    },
                    mouseover: function (e) {
                        var tip = new Ext.ToolTip({
                            title: comment.host + ' - ' + comment.service +
                                ' (' +
                                Ext.util.Format.date(new Date(comment.timestamp * 1000),
                                                     'Y-m-d H:i:s') +
                                '):',
                            renderTo: Ext.getBody(),
                            anchor: 'left',
                            target: e.target,
                            html: comment.author + ': ' + comment.text,
                            listeners: {
                                hide: function (me) {
                                    me.destroy.createDelegate(me, [], 1000);
                                }
                            }
                        });

                        tip.show();
                    }
                });
            }, this);
        },

        plot: Ext.ux.flot.Flot.prototype.plot.createSequence(function () {
            this.annotate();
        })
    });
}());