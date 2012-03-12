/**
 * Ext.ux.ingraph.icingaweb.Cronk
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.ingraph.icingaweb');

    /**
     * @class Ext.ux.ingraph.icingaweb.Cronk
     * @namespace Ext.ux.ingraph.icingaweb
     * @singleton
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * Cronk utility.
     */
    Ext.ux.ingraph.icingaweb.Cronk = (function () {
        // internal template for the title of the cronk-tab
        var titleTpl = new Ext.XTemplate(
            '<tpl if="values.view">iG: {view}</tpl>',
            '<tpl if="!values.view">iG: {host}',
            '<tpl if="values.service"> - {service}',
            '</tpl>',
            '</tpl>',
            {
                compiled: true
            }
        );

        // public
        return {
            /**
             * Open a new inGraph cronk.
             * @method open
             * @param {Object} cfg
             */
            open: function (cfg) {
                var cronk = {
                        id: Ext.id(),
                        title: cfg.title,
                        crname: 'inGraph',
                        iconCls: 'icinga-cronk-icon-stats2',
                        closable: true,
                        params: {
                            host: cfg.host,
                            service: cfg.service
                        }
                    },
                    tabPanel = Ext.getCmp('cronk-tabs'),
                    cronkPanel = Cronk.factory(cronk);

                tabPanel.add(cronkPanel);
                tabPanel.setActiveTab(cronkPanel);
            }, // Eof open

            /**
             * Display a new inGraph window.
             * @method Window
             * @param {Object} cfg
             */
            Window: function (cfg) {
                var win = new Ext.Window({
                    title: cfg.title,
                    width: cfg.width,
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'xigview',
                            border: false,
                            tbarConfig: {
                                enable: false
                            },
                            panelConfig: {
                                height: cfg.height,
                                header: false,
                                // Do not collapse if empty
                                showEmpty: true,
                                border: false,
                                overview: cfg.overview,
                                tbarConfig: {
                                    // Disable sync button since we render one
                                    // child only
                                    showSync: false,
                                    // Add 'Open As Cronk' button before
                                    // tbar's controls
                                    prependButtons: true,
                                    buttons: [
                                        {
                                            text: _('Open As Cronk'),
                                            scope: this,
                                            handler: function () {
                                                this.open(cfg);
                                            }
                                        }
                                    ]
                                },
                                flotConfig: {
                                    listeners: {
                                        plot: function (flot) {
                                            // flot -> panel -> view -> window
                                            var win = flot.ownerCt.ownerCt.ownerCt;
                                            if (flot.store.isEmpty()) {
                                                win.setTitle(cfg.title + ' (' + _('No Data') + ')');
                                            } else {
                                                win.setTitile(cfg.title);
                                            }
                                        }
                                    }
                                }
                            },
                            host: cfg.host,
                            service: cfg.service,
                            start: cfg.start,
                            end: cfg.end
                        } // Eof xigview
                    ] // Eof Items
                });

                win.show();
            },

            /**
             * Display a new inGraph popup.
             * @method Popup
             * @param {Object} cfg
             */
            Popup: function (cfg) {
                var tip = new Ext.ToolTip({
                    title: cfg.title,
                    target: cfg.target,
                    anchor: 'left',
                    dismissDelay: 0,
                    width: cfg.width,
                    items: [
                        {
                            xtype: 'xigview',
                            tbarConfig: {
                                enable: false
                            },
                            panelConfig: {
                                height: cfg.height,
                                header: false,
                                showEmpty: true,
                                tbarConfig: {
                                    enable: false
                                },
                                autoYAxes: false,
                                flotConfig: {
                                    flotStyle: {
                                        xaxis: {
                                            show: false,
                                            mode: 'time'
                                        },
                                        yaxis: {
                                            show: false
                                        },
                                        grid: {
                                            hoverable: false,
                                            clickable: false
                                        },
                                        legend: {
                                            show: false
                                        }
                                    },
                                    listeners: {
                                        single: true,
                                        plot: function (flot) {
                                            // flot -> panel -> view -> tip
                                            var tip = flot.ownerCt.ownerCt.ownerCt;
                                            if (flot.store.isEmpty()) {
                                                tip.setTitle(cfg.title + ' (' + _('No Data') + ')');
                                            }
                                        }
                                    }
                                }
                            },
                            host: cfg.host,
                            service: cfg.service,
                            start: cfg.start,
                            end: cfg.end
                        } // Eof xigview
                    ], // Eof items
                    listeners: {
                        hide: function (me) {
                            // TODO(el): No delay leads to "cannot set style of undefined"
                            me.destroy.createDelegate(me, [], 1000);
                        }
                    }
                });

                tip.show();
            },

            /**
             * Set a new cronk-tab title.
             * <b>Note</b>: Since this function expects <tt>this</tt> as cronk
             * make sure to operate on the appropiate scope.
             * @method setTitle
             * @param {Object} cfg
             */
            setTitle: function (cfg) {
                var title = titleTpl.apply(cfg),
                    cronkTabs = this.getParent();

                cronkTabs.setTitle(title);

                if (cronkTabs.tabEl) {
                    Ext.fly(cronkTabs.tabEl).child(
                        'span.x-tab-strip-text',
                        true
                    ).qtip = title;
                } else {
                    AppKit.log("iG: No tabEl: ", this, cronkTabs);
                }
            }
        }; // Eof return
    }());
}());
