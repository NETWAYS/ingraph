/**
 * Ext.ux.ingraph.View
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

    Ext.ns('Ext.ux.ingraph');

    /**
     * @class Ext.ux.ingraph.View
     * @extends Ext.Panel
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Container for <tt>{@link Ext.ux.flot.Panel}<tt>s. Based on
     * a passed configuration object this component decides which strategy to use
     * to add child items.
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigview
     */
    Ext.ux.ingraph.View = Ext.extend(Ext.Panel, {
        autoScroll: true,

        layout: 'anchor',

        baseCls: 'x-plain',

        printText: _('Print all charts of this view'),

        saveText: _('Save...'),

        /**
         * @cfg {Object} panelConfig
         */
        // See injectDefaults
        // TODO(el): Document

        /**
         * @cfg {Object} tbarConfig
         */
        // See injectDefaults
        // TODO(el): Document

        defaults: {
            xtype: 'xflotpanel',
            bodyStyle: 'padding: 2px;',
            height: 220,
            tools: [
                {
                    id: 'gear',
                    qtip: _('Change panel settings'),
                    handler: function (e, toolEl, flotPanel) {
                        var panelSettings = new Ext.ux.flot.PanelSettingsWindow({
                            flotPanel: flotPanel
                        });

                        panelSettings.show();
                    } // Eof handler
                },
                {
                    id: 'plus',
                    qtip: _('Clone this panel'),
                    handler: function (e, toolEl, flotPanel) {
                        var view = flotPanel.ownerCt,
                            index = view.items.indexOfKey(flotPanel.id),
                            panelConfig = flotPanel.getState();

                        var cfg = view.buildPanelCfg(
                            panelConfig.title,
                            panelConfig.templateContent,
                            panelConfig.baseParams.query,
                            panelConfig.overviewConfig,
                            panelConfig.tbarConfig,
                            panelConfig.baseParams.startx,
                            panelConfig.baseParams.endx,
                            panelConfig.legendConfig
                        );

                        view.insert(index, cfg);
                        view.doLayout();
                    }
                },
                {
                    id: 'close',
                    qtip: _('Remove this panel'),
                    handler: function (e, toolEl, flotPanel) {
                        flotPanel.destroy();
                    }
                }
            ]
        },

        // private
        initComponent: function () {
            var cfg = {};
            this.injectDefaults();
            this.buildTools(cfg);
            this.buildItems(cfg);
            this.buildTbar(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.View.superclass.initComponent.call(this);
            this.addEvents(
                /**
                 * @event ready
                 * If the remote template request succeeds the event fires after
                 * the items built from it are added to this component.
                 * @param {Ext.ux.ingraph.View} this
                 */
                'ready',
                /**
                 * @event exception
                 * Fires if the remote template request fails.
                 * @param {Ext.ux.ingraph.View} this
                 */
                'exception'
            );
            this.initEvents();
        },

        // private
        injectDefaults: function (cf) {
            var defaults = {
                panelConfig: Ext.apply({
                }, this.panelConfig),

                tbarConfig: Ext.apply({
                    enable: true
                }, this.tbarConfig)
            };
            Ext.apply(this, Ext.apply(this.initialConfig, defaults));
        },

        // private
        initEvents: function () {
            this.on({
                scope: this,
                sync: function (tbar, startx, endx) {
                    var triggeringPanel = tbar.ownerCt;

                    this.items.each(function (panel) {
                        if (triggeringPanel === panel) {
                            // Do not update the source panel
                            return true;
                        }

                        panel.store.load({
                            params: {
                                startx: startx,
                                endx: endx
                            }
                        });
                    });
                }
            });
        },

        // private
        buildTools: Ext.emptyFn, // Template method

        // private
        fromView: function (cfg) {
            if (!this.view) {
                return false;
            }

            var items = [];

            var callback = function (view) {
                this.setTitle(view.content.title);

                this.view = view;

                this.panels = this.createPanelStore({
                    data: view.content.panels
                });

                this.panels.each(function (panel) {
                    var query = Ext.encode(
                        Ext.ux.ingraph.Util.buildQuery(panel.json.series));

                    panel.json.flot = $.extend(true, {},
                                               view.content.flot || {},
                                               panel.json.flot || {});

                    var cfg = this.buildPanelCfg(
                        panel.get('title'),
                        panel.json,
                        query,
                        panel.get('overviewConfig'),
                        panel.get('tbarConfig'),
                        panel.get('start'),
                        panel.get('end'),
                        panel.get('legendConfig')
                    );

                    items.push(cfg);
                }, this); // Eof each panel

                this.addViewTbarItems();

                this.add(items);
                this.doLayout();
            }; // Eof callback

            this.doRequest(
                Ext.ux.ingraph.Urls.provider.view,
                {
                    view: this.view
                },
                callback
            );

            return true;
        },

        // private
        fromHostService: function (cfg) {
            // This strategy is responsible for both host and host-service charts
            if (!this.host) {
                return false;
            }

            var callback = function (template) {
                this.template = template;
                this.template.re = template.content.re;

                var items = [];

                if (this.start || this.end) {
                    this.panels = this.createPanelStore({
                        data: [
                            {
                                start: this.start,
                                end: this.end,
                                title: _('Custom Time Range')
                            }
                        ]
                    });
                } else {
                    this.panels = this.createPanelStore({
                        data: template.content.panels
                    });
                }

                this.panels.each(function (panel) {
                    var query = Ext.encode(
                        Ext.ux.ingraph.Util.buildQuery(
                            panel.get('series') || template.content.series));

                    var cfg = this.buildPanelCfg(
                        String.format(
                            panel.get('title'),
                            {
                                host: this.host,
                                service: this.service
                            }
                        ),
                        template.content,
                        query,
                        panel.get('overviewConfig'),
                        panel.get('tbarConfig'),
                        panel.get('start'),
                        panel.get('end'),
                        panel.get('legendconfig')
                    );

                    items.push(cfg);
                }, this); // Eof each panel

                this.addTemplateTbarItems();

                this.add(items);
                this.doLayout();
            }; // Eof callback

            this.doRequest(
                Ext.ux.ingraph.Urls.provider.template,
                {
                    host: this.host,
                    service: this.service
                },
                callback
            );

            return true;
        },

        // private
        fromPanels: function (cfg) {
            if (!this.panels) {
                return false;
            }

            var items = [];

            Ext.each(this.panels, function (panelConfig) {
                var itemConfig = this.buildPanelCfg(
                    panelConfig.title,
                    panelConfig.templateContent,
                    panelConfig.baseParams.query,
                    panelConfig.overviewConfig,
                    panelConfig.tbarConfig,
                    panelConfig.baseParams.startx,
                    panelConfig.baseParams.endx,
                    panelConfig.legendConfig
                );

                items.push(itemConfig);
            }, this);

            cfg.items = items;

            delete this.panels;

            return true;
        },

        // private
        buildItems: function (cfg) {
            var strategies = [this.fromPanels, this.fromHostService, this.fromView];
            Ext.each(strategies, function (strategy) {
                // If the strategy returns true to indicate that it was responsible
                // return false to cancel iteration
                return !strategy.call(this, cfg);
            }, this);
        },

        // private
        buildTbar: function (cfg) {
            if (this.tbarConfig.enable === true && !this.tbar) {
                cfg.tbar = {};
            }
        },

        // private
        addViewTbarItems: function () {
            var tbar = this.getTopToolbar();

            if (!tbar) {
                return;
            }

            tbar.add([
                {
                    text: _('View'),
                    menu: [
                        {
                            text: _('Save'),
                            iconCls: 'xflot-icon-save',
                            scope: this,
                            handler: this.saveViewHandler
                        },
                        {
                            text: _('Save As...'),
                            iconCls: 'xflot-icon-save-new',
                            scope: this,
                            handler: this.saveAsViewHandler
                        }
                    ]
                },
                {
                    xtype: 'tbspacer',
                    width: 50
                },
                {
                    xtype: 'tbtext',
                    text: this.view.name
                },
                {
                    xtype: 'tbfill'
                },
                {
                    tooltip: this.printText,
                    iconCls: 'xflot-icon-print',
                    scope: this,
                    handler: this.printHandler
                }
            ]);

            tbar.doLayout();
        },

        // private
        addTemplateTbarItems: function () {
            var tbar = this.getTopToolbar();

            if (!tbar) {
                return;
            }

            tbar.add([
                {
                    text: _('Template'),
                    menu: [
//                        {
//                            text: _('Save'),
//                            iconCls: 'xflot-icon-save',
//                            scope: this,
//                            disabled: true,
//                            handler: this.saveTemplateHandler
//                        },
                        {
                            text: _('Save As View'),
                            iconCls: 'xflot-icon-save-new',
                            scope: this,
                            handler: this.saveAsViewHandler
                        }
                    ]
                },
                {
                    xtype: 'tbspacer',
                    width: 50
                },
                {
                    xtype: 'tbtext',
                    text: this.template.name
                },
                {
                    xtype: 'tbfill'
                },
                {
                    tooltip: this.printText,
                    iconCls: 'xflot-icon-print',
                    scope: this,
                    handler: this.printHandler
                }
            ]);

            tbar.doLayout();
        },

        saveView: function (viewTitle, url, fileName) {
            var view = {
                title: viewTitle,
                panels: []
            };

            this.items.each(function (panel) {
                var panelConfig = {};

                panelConfig.series = panel.template.toJson(['host', 'service',
                                                            're', 'plot',
                                                            'type', 'plot_id']);
                panelConfig.title = panel.initialConfig.title;
                panelConfig.flot = panel.template.getStyle();
                panelConfig.tbarConfig = panel.tbarConfig;
//                panelConfig.flotConfig = panel.flotConfig;
                panelConfig.overviewConfig = Ext.copyTo({},
                                                        panel.overviewConfig,
                                                        ['enable', 'height']);
                panelConfig.start = panel.store.baseParams.startx;
                panelConfig.end = panel.store.baseParams.endx;

                view.panels.push(panelConfig);
            }, this);

            Ext.Ajax.request({
                url: url,
                params: {
                    content: Ext.encode(view),
                    name: fileName
                },
                scope: this
//                ,success: function () { console.log(arguments);},
//                failure: function () { console.log(arguments);}
            });
        },

        saveViewHandler: function () {
            this.saveView(this.title, Ext.ux.ingraph.Urls.views.update, this.view.name);
        },

        saveAsViewHandler: function () {
            var viewDialog = new Ext.Window({
                title: _('View'),
                layout: 'fit',
                width: 220,
                height: 125,
                modal: true,
                plain: false,
                bodyStyle: 'padding: 5px;',
                items: {
                    xtype: 'form',
                    baseCls: 'x-plain',
                    labelWidth: 70,
                    ref: 'viewConfigForm',
                    items: [
                        {
                            fieldLabel: _('View Title'),
                            name: 'viewTitle',
                            xtype: 'textfield',
                            enableKeyEvents: true,
                            anchor: '100%',
                            allowBlank: false
                        },
                        {
                            fieldLabel: _('File Name'),
                            name: 'fileName',
                            xtype: 'textfield',
                            enableKeyEvents: true,
                            anchor: '100%',
                            allowBlank: false,
                            stripCharsRe: /\W/g
                        }
                    ],
                    monitorValid: true,
                    listeners: {
                        clientvalidation: function (form, valid) {
                            // form -> window -> ref of save
                            var saveBtn = form.ownerCt.saveBtn;

                            saveBtn.setDisabled(!valid);
                        }
                    }
                },
                buttonAlign: 'right',
                buttons: [
                    {
                        text: _('Save'),
                        iconCls: 'xflot-icon-save',
                        ref: '../saveBtn',
                        disabled: true,
                        handler: function (btn) {
                            // btn -> bbar -> window
                            var win = btn.ownerCt.ownerCt,
                                form = win.viewConfigForm.getForm();

                            var viewTitle = form.findField('viewTitle').getValue();
                            var fileName = form.findField('fileName').getValue();

                            this.saveView(viewTitle, Ext.ux.ingraph.Urls.views.create, fileName);

                            win[win.closeAction]();
                        },
                        scope: this
                    },
                    {
                        text: _('Cancel'),
                        iconCls: 'xflot-icon-cancel',
                        handler: function (btn) {
                            // btn -> bbar -> window
                            var win = btn.ownerCt.ownerCt;

                            win[win.closeAction]();
                        }
                    }
                ], // Eof buttons
                onShow: function () {
                    this.items.get(0).items.get(0).focus('', 50);
                }
            });

            viewDialog.show();
        },

        saveTemplate: function (re, url, fileName) {
            var template = {
                re: re,
                panels: []
            };

            this.items.each(function (panel) {
                var panelConfig = {};

                panelConfig.series = panel.template.toJson('type', 'plot');
                panelConfig.title = panel.initialConfig.title;
                panelConfig.flot = panel.template.getStyle();
                panelConfig.tbarConfig = panel.tbarConfig;
//                panelConfig.flotConfig = panel.flotConfig;
                panelConfig.overviewConfig = Ext.copyTo({},
                                                        panel.overviewConfig,
                                                        ['enable', 'height']);
                panelConfig.start = panel.store.baseParams.startx;
                panelConfig.end = panel.store.baseParams.endx;
                
                delete panelConfig.group;
                
                template.panels.push(panelConfig);
            }, this);

            Ext.Ajax.request({
                url: url,
                params: {
                    content: Ext.encode(template),
                    name: fileName
                },
                scope: this
//                ,success: function () { console.log(arguments);},
//                failure: function () { console.log(arguments);}
            });
        },

        saveTemplateHandler: function () {
            if (this.template.isDefault === true) {
                url = Ext.ux.ingraph.Urls.templates.create;
            } else {
                this.saveTemplate(this.template.re, Ext.ux.ingraph.Urls.templates.update, this.template.name);
            }
        },

        /**
         * Get this component's state.
         * @method getState
         * @return {Object}
         */
        getState: function () {
            var panels = [];
            this.items.each(function (panel) {
                panels.push(panel.getState());
            });
            return {
                title: this.title,
                xtype: this.getXType(),
                panelConfig: this.panelConfig,
                tbarConfig: this.tbarConfig,
                panels: panels,
                template: this.template ? Ext.copyTo({}, this.template, ['name', 're', 'isDefault']) : null,
                view: this.view ? Ext.copyTo({}, this.view, 'name') : null
            };
        },

        /**
         * Apply state to this component.
         * @method applyState
         * @param {Object} state
         */
        applyState: function (state) {
            if (state.title) {
                this.setTitle(state.title);
            }

            var items = [];

            this.tbarConfig = state.tbarConfig;

            this.template = state.template;
            this.view = state.view;

            if (this.template) {
                this.addTemplateTbarItems();
            } else if (this.view) {
                this.addViewTbarItems();
            }

            Ext.each(state.panels, function (panelConfig) {
                var cfg = this.buildPanelCfg(
                    panelConfig.title,
                    panelConfig.templateContent,
                    panelConfig.baseParams.query,
                    panelConfig.overviewConfig,
                    panelConfig.tbarConfig,
                    panelConfig.baseParams.startx,
                    panelConfig.baseParams.endx,
                    panelConfig.legendConfig
                );

                items.push(cfg);
            }, this);

            this.add(items);
            this.doLayout();
        },

        // private
        doRequest: function (url, params, callback) {
            Ext.Ajax.request({
                url: url,
                scope: this,
                success: function (res) {
                    var decodedResponse = null;
                    if (res.responseText) {
                        decodedResponse = Ext.decode(res.responseText);
                    } else {
                        this.fireEvent('exception', this);
                    }
                    callback.call(this, decodedResponse);
                    this.fireEvent('ready', this);
                },
                failure: function () {
                    this.fireEvent('exception', this, arguments);
                },
                params: params
            });
        },

        // private
        printHandler: function () {
            var printContainer = Ext.getBody().select('div.flot-print-container');
            printContainer.each(function (ct) {
                ct.destroy();
            });

            this.items.each(function (flotPanel) {
                flotPanel.preparePrint();
            });

            window.print();
        },

        // private
        createPanelStore: function (cfg) {
            cfg = cfg || {};
            Ext.applyIf(cfg, {
                fields: [
                    {
                        name: 'title',
                        defaultValue: _('No Title')
                    },
                    {
                        name: 'start'
                    },
                    {
                        name: 'end',
                        defaultValue: 'now'
                    },
                    {
                        name: 'overviewConfig',
                        defaultValue: {
                            enable: false
                        }
                    },
                    {
                        name: 'tbarConfig',
                        defaultValue: {}
                    },
                    {
                        name: 'legendConfig',
                        defaultValue: {}
                    },
                    {
                        name: 'series',
                        defaultValue: null
                    }
                ] // Eof fields
            }); // Eof applyIf
            return new Ext.data.JsonStore(cfg);
        },

        // private
        buildPanelCfg: function (title, templateContent, query, overviewConfig,
                                 tbarConfig, startx, endx, legendConfig) {
            var cfg = {
                title: Ext.util.Format.htmlEncode(title),

                template: new Ext.ux.flot.Template({
                    data: templateContent
                }),

                flotConfig: {
                    flotStyle: {
                        xaxis: {
                            show: true,
                            mode: 'time',
                            tickFormatter: Ext.ux.ingraph.Util.xTickFormatter
                        },
                        yaxis: {
                            tickFormatter: Ext.ux.ingraph.Util.yTickFormatter
                        },
                        selection: {
                            mode: 'x'
                        },
                        grid: {
                            hoverable: true,
                            clickable: true
                        },
                        series: {
                            lines: {
                                show: true
                            }
                        }
                    }
                },

                overviewConfig: Ext.apply(
                    {},
                    overviewConfig,
                    {
                        store: {
                            fields: Ext.ux.flot.Fields.seriesFields({
                                data: {
                                    convert: function (v) {
                                        Ext.each(v, function (xy) {
                                            xy[0] *= 1000;
                                        });
                                        return v;
                                    }
                                }
                            }),
                            xtype: 'xflotstore',
                            url: Ext.ux.ingraph.Urls.provider.values,
                            baseParams: {
                                query: query
                            }
                        },
                        autoYAxes: false,
                        flotStyle: {
                            xaxis: {
                                show: true,
                                mode: 'time',
                                tickFormatter: Ext.ux.ingraph.Util.xTickFormatter
                            },
                            yaxis: {
                                show: false
                            },
                            selection: {
                                color: '#FA5C0D',
                                mode: 'x'
                            },
                            legend: {
                                show: false
                            },
                            grid: {
                                hoverable: false,
                                clickable: false
                            },
                            series: {
                                lines: {
                                    show: true
                                }
                            }
                        }
                    }
                ),

                tbarConfig: tbarConfig,

                legendConfig: legendConfig,

                store: {
                    xtype: 'xflotstore',
                    url: Ext.ux.ingraph.Urls.provider.values,
                    fields: Ext.ux.flot.Fields.seriesFields({
                        data: {
                            convert: function (v) {
                                Ext.each(v, function (xy) {
                                    xy[0] *= 1000;
                                });
                                return v;
                            }
                        }
                    }),
                    baseParams: {
                        query: query,
                        startx: startx,
                        endx: endx
                    }
                },

                getState: function () {
                    var templateData = {};
                    templateData[this.template.root] = this.template.toJson(
                        ['host', 'service', 're', 'plot', 'type', 'plot_id']);
                    templateData.flot = this.template.getStyle();

                    return {
                        title: this.initialConfig.title,

                        tbarConfig: this.tbarConfig,
//                        flotConfig: this.flotConfig,
                        overviewConfig: Ext.copyTo({}, this.overviewConfig,
                                                   ['enable', 'height']),
                        legendConfig: this.legendConfig,

                        baseParams: Ext.apply(
                            {},
                            this.store.lastOptions,
                            this.store.baseParams
                        ),

                        templateContent: templateData
                    };
                }
            };

            cfg = $.extend(true, {}, cfg, this.panelConfig);

            return cfg;
        }
    });
    Ext.reg('xigview', Ext.ux.ingraph.View);
}());
