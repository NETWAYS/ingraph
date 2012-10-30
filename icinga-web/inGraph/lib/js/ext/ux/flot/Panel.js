/**
 * Ext.ux.flot.Panel
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of Ext.ux.flot.
 *
 * Ext.ux.flot is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * Ext.ux.flot is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Ext.ux.flot. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

(function () {
    "use strict";

    Ext.ns('Ext.ux.flot');

    /**
     * @class Ext.ux.flot.Panel
     * @extends Ext.Panel
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * TODO(el): Document
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflotpanel
     */
    Ext.ux.flot.Panel = Ext.extend(Ext.Panel, {
        /**
         * @cfg {Boolean} loadMask
         * Whether to mask the panel while loading.
         */
        loadMask: true,

        /**
         * @cfg {Object} overviewConfig
         * Overview configuration object.
         */
        // See injectDefaults
        // TODO(el): Document

        /**
         * @cfg {Object} flotConfig
         * Configuration object to pass to the wrapped
         * <tt>{@link Ext.ux.flot.Flot}</tt> component.
         */
        // See injectDefaults
        // TODO(el): Document

        /**
         * @cfg {Object} tbarConfig
         * Configuration object to pass to this components
         * <tt>{@link Ext.ux.flot.Tbar}</tt> toolbar.
         */
        // See injectDefaults
        // TODO(el): Document

        /**
         * @cfg {Object} legendConfig
         * Legend configuration object.
         */
        // See injectDefaults
        // TODO(el): Document

        /**
         * @cfg {String} emptyText
         * Text to add to panel's title on no data.
         * Defaults to <tt>'No Data'</tt>.
         */
        emptyText: _('No Data'),

        /**
         * @cfg {Bolean} showEmpty
         * <tt>true</tt> to don't collapse panel on no data.
         * Defaults to <tt>false</tt>.
         */
        showEmpty: false,

        collapsible: true,
        animCollapse: true,
        layout: 'vbox',
        layoutConfig: {
            align: 'stretch',
            pack: 'start'
        },

        /**
         * @cfg {Ext.data.Store} store The {@link Ext.data.Store} the panel
         * should use as its data source (required).
         */

        /**
         * @cfg {Ext.ux.flot.Template} template The {@link Ext.ux.flot.Template}
         * the panel should use as its template (required).
         */

        constructor: function (cfg) {
            // Lookup stores first because initEvents rely on them
            cfg.store = Ext.StoreMgr.lookup(cfg.store);
            cfg.template = Ext.StoreMgr.lookup(cfg.template);
            Ext.ux.flot.Panel.superclass.constructor.call(this, cfg);
        },

        // private
        initComponent: function () {
            var cfg = {};
            this.injectDefaults();
            this.buildItems(cfg);
            this.buildTbar(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.Panel.superclass.initComponent.call(this);
        },

        // private
        injectDefaults: function () {
            var defaults = {
                flotConfig: Ext.apply(
                    {
                        flex: 1
                    },
                    this.flotConfig
                ),

                overviewConfig: Ext.apply(
                    {
                        enable: false,
                        height: 40
                    },
                    this.overviewConfig
                ),

                tbarConfig: Ext.apply(
                    {
                        enable: true
                    },
                    this.tbarConfig
                ),

                legendConfig: Ext.apply(
                    {
                        height: 40
                    },
                    this.legendConfig
                )
            };
            Ext.apply(this, Ext.apply(this.initialConfig, defaults));
        },

        // private
        buildItems: function (cfg) {
            var items = [Ext.apply(
                {},
                this.flotConfig,
                {
                    ref: 'flot',
                    xtype: 'xflot',
                    store: this.store,
                    template: this.template
                }
            )];

            if (this.template.legend.get('position') === 'beneath' &&
                    this.template.legend.get('show') !== false) {
                var legendContainerId = Ext.id();

                items.push(Ext.apply(
                    {},
                    this.legendConfig,
                    {
                        xtype: 'container',
                        id: legendContainerId,
                        cls: 'xflot-legend',
                        autoScroll: true
                    }
                ));

                this.on({
                    scope: this,
                    single: true,
                    render: function () {
                        this.template.legend.set('container',
                                                 '#' + legendContainerId);
                    }
                });
            } // Eof position beneath
            
            if (this.template.xaxis.get('position') === 'top') {
                // Auto-margin does not work properly
                this.template.grid.set('minBorderMargin', 10);
            }

            if (this.overviewConfig.enable === true) {
                items = items.concat([
                    {
                        xtype: 'spacer',
                        height: 1,
                        cls: 'xflot-spacer'
                    },
                    Ext.apply(
                        {},
                        this.overviewConfig,
                        {
                            ref: 'overview',
                            xtype: 'xflot',
                            template: this.template,
                            listeners: {
                                scope: this,
                                beforezoomin: function (flot, ranges) {
                                    if (this.overview.selTip) {
                                        this.overview.selTip.hide();
                                    }
                                    if (ranges) {
                                        this.flot.zoomin(ranges);
                                    }
                                    // Overview does NOT zoom in
                                    return false;
                                },
                                contextmenu: function (flot, event) {
                                    // Suppress browser's contextmenu
                                    event.stopEvent();
                                    if (this.overview.$plot.getSelection()) {
                                        this.store.load();
                                        this.overview.$plot.clearSelection();
                                    }
                                },
                                beforezoomout: function () {
                                    // Overview does NOT zoom out
                                    return false;
                                },
                                plotselecting: function (flot, ranges, pos) {
                                    if (ranges) {
                                        this.flot.store.stopRefresh();

                                        var clipped = this.overview.clip(ranges),
                                            style = this.flot.$flotStyle;

                                        Ext.apply(style.xaxis, {
                                            min: ranges.xaxis.from,
                                            max: ranges.xaxis.to
                                        });

                                        this.flot.$plot = $.plot($('#' + this.flot.id),
                                                                 clipped, style);
                                    }
                                }
                            } // Eof listeners
                        } // Eof overview
                    ) // Eof Ext.apply
                ]); // Eof items.concat
            } // Eof overview enabled

            cfg.items = items;
        },

        // private
        buildTbar: function (cfg) {
            if (this.tbarConfig.enable === true && !this.tbar) {
                cfg.tbar = Ext.apply(
                    {},
                    this.tbarConfig,
                    {
                        xtype: 'xflottbar',
                        store: this.store,
                        activeFrame: this.store.baseParams.startx
                    }
                );
            }
        },

        // private
        initEvents: function () {
            Ext.ux.flot.Panel.superclass.initEvents.call(this);

            if (this.loadMask) {
                this.loadMask = new Ext.LoadMask(this.bwrap,
                    Ext.apply({
                        store: this.store,
                        removeMask: true
                    }, this.loadMask)
                    );
            }

            this.flot.on({
                scope: this,
                single: true,
                plot: function () {
                    if (this.store.isEmpty()) {
                        this.xsetTitle(true);
                        if (this.showEmpty === false) {
                            this.collapse();
                        }
                    }
                    this.flot.on({
                        scope: this,
                        plot: function () {
                            if (this.store.isEmpty()) {
                                this.xsetTitle(true);
                            } else {
                                this.xsetTitle();
                            }
                        }
                    });
                }
            });

            if (this.overviewConfig.enable === true) {
                this.overview.on({
                    scope: this,
                    single: true,
                    plot: function () {
                        if (this.flot.$plot) {
                            // TODO(el): Check for mode time
                            this.overview.$plot.setSelection({
                                xaxis: {
                                    from: this.flot.store.getStartX() * 1000,
                                    to: this.flot.store.getEndX() * 1000
                                }
                            }, true); // True to suppress firing plotselected event
                        }

                        this.mon(this.flot.store, {
                            scope: this,
                            load: function (store) {
                                // TODO(el): Check for mode time
                                this.overview.$plot.setSelection({
                                    xaxis: {
                                        from: store.getStartX() * 1000,
                                        to: store.getEndX() * 1000
                                    }
                                }, true);
                            }
                        });
                    }
                });
            } // Eof if overview
        },

        // private
        preparePrint: function () {
            // Plot into a new a container, yet hidden
            var id = String.format('{0}-print', this.id),
                el = Ext.DomHelper.append(Ext.getBody(), {
                    tag: 'div',
                    cls: 'flot-print-container',
                    children: [
                        {
                            tag: 'div',
                            cls: 'flot-print-title',
                            html: this.title
                        },
                        {
                            tag: 'div',
                            id: id,
                            cls: 'flot-print-graph',
                            style: {
                                width: '670px',
                                height: '170px'
                            }
                        }
                    ] // Eof children
                }, true);

            this.flot.plot(id);

            // If the window recieves focus, e.g. after dismissing any print dialog
            // remove the new container
            Ext.EventManager.addListener(window, 'focus', function () {
                Ext.destroy.defer(1000, this, [el]);
            }, this, {single: true});
        },

        // private
        xsetTitle: function (empty) {
            var title;
            if (empty === true) {
                title = String.format('{0} ({1})', this.initialConfig.title,
                                      this.emptyText);
            } else {
                title = this.initialConfig.title;
            }
            this.setTitle(title);
        }
    });
    Ext.reg('xflotpanel', Ext.ux.flot.Panel);
}());
