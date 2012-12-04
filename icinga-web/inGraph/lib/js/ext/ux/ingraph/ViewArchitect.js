/**
 * Ext.ux.ingraph.ViewArchitect
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
     * @class Ext.ux.ingraph.ViewArchitect
     * @extends Ext.Container
     * @namespace Ext.ux.ingraph
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @xtype xiviewarchitect
     */
    Ext.ux.ingraph.ViewArchitect = Ext.extend(Ext.ux.wizard.Wizard, {
        /**
         * @cfg {String} dateText
         * The quicktip text displayed for the start and end datefield.
         * (defaults to help on english textual date or time).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        dateText: _('Either select date via the popup date picker or input an ' +
                    'English textual date or time, e.g.<br />' +
                    '<ul style="list-style-type:circle;' +
                        'list-style-position:inside;">' +
                        '<li>now</li>' +
                        '<li>last month</li>' +
                        '<li>last mon(day)</li>' +
                        '<li>last year 6 months</li>' +
                        '<li>-6 hours 30 minutes 10 secs</li>' +
                        '<li>-1 month + 10 days</li>' +
                        '<li>3 October 2005</li>' +
                    '</ul>'),
        // private override
        initComponent: function () {
            this.buildStores();
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.ingraph.ViewArchitect.superclass.initComponent.call(this);
        },
        // private override
        onLast: function () {
            var flotCfg = {
                    series: {
                        lines: {
                            show: true,
                            steps: false,
                            lineWidth: 2,
                            fill: false
                        },
                        stack: false
                    },
                    legend: {
                        "position": "nw"
                    }
                },
                values = this.viewConfig.getForm().getValues(),
                groups = this.store.collect(values.groupby),
                panels = [],
                panel,
                stateuid = Ext.id();
            // Overwrite start and end
            values.start = this.startDateField.strValue ||
                           this.startDateField.getValue() ?
                           this.startDateField.getValue().getTime() / 1000 : null;
            values.end = this.endDateField.strValue ||
                         this.endDateField.getValue() ?
                         this.endDateField.getValue().getTime() / 1000 : null;
            switch (values.chartType) {
                case 'Bar Chart':
                    Ext.apply(flotCfg.series.lines, {
                        steps: true
                    });
                    break;
                case 'Bar Area Chart':
                    Ext.apply(flotCfg.series.lines, {
                        steps: true,
                        fill: true,
                        fillColor: {
                            colors: [
                                {
                                    opacity: 0.7
                                },
                                {
                                    opacity: 0.9,
                                    brightness: 0.9
                                }
                            ]
                        }
                    });
                    break;
                case 'Area Chart':
                    Ext.apply(flotCfg.series.lines, {
                        fill: true,
                        fillColor: {
                            colors: [
                                {
                                    opacity: 0.7
                                },
                                {
                                    opacity: 0.9,
                                    brightness: 0.9
                                }
                            ]
                        }
                    });
                    break;
            }
            Ext.each(groups, function (group) {
                panel = {
                    series: [],
                    start: values.start,
                    end: values.end,
                    interval: values.interval,
                    title: group
                };
                this.store.query(values.groupby, group).each(function (series) {
                    panel.series.push({
                        host: series.data.host,
                        service: series.data.service,
                        parentService: series.data.parentService,
                        plot: series.data.plot,
                        type: values.type,
                        group: series.data.host + ' - ' +
                            (series.data.parentService ?
                             series.data.parentService + ' - ' :
                             ('' + series.data.service ?
                              series.data.service + ' - ' :
                              '')) + series.data.plot,
                        plot_id: series.data.host + ' - ' +
                            (series.data.parentService ?
                             series.data.parentService + ' - ' :
                             ('' + series.data.service ?
                              series.data.service + ' - ' :
                              '')) + series.data.plot + ' - ' + values.type
                    });
                });
                panels.push(panel);
            }, this);
            var cronk = {
                    id: Ext.id(),
                    title: values.title,
                    crname: 'inGraph',
                    iconCls: 'icinga-cronk-icon-stats2',
                    closable: true,
                    stateuid: stateuid,
                    params: {
                        hideMenu: true
                    }
                },
                tabPanel = Ext.getCmp('cronk-tabs'),
                cronkPanel = Cronk.factory(cronk);
            var view = new Ext.ux.ingraph.View({
                stateId: stateuid
            });
            cronkPanel.add(view);
            view.setTitle(values.title);
            view.view = {
                name: values.title
            };
            view.panels = view.createPanelStore({
                data: panels
            });
            var items = [];
            view.panels.each(function (panel) {
                var query = Ext.encode(
                    Ext.ux.ingraph.Util.buildQuery(panel.json.series));

                panel.json.flot = flotCfg;

                var cfg = this.buildPanelCfg(
                    panel.get('title'),
                    panel.json,
                    query,
                    panel.get('overviewConfig'),
                    panel.get('tbarConfig'),
                    panel.get('start'),
                    panel.get('end'),
                    panel.get('legendConfig'),
                    panel.get('interval')
                );

                items.push(cfg);
            }, view); // Eof each panel

            view.addViewTbarItems();

            view.add(items);
            view.doLayout();
            tabPanel.add(cronkPanel);
            tabPanel.setActiveTab(cronkPanel);
            // Manual handling of ext state
            Ext.state.Manager.getProvider().set(view.stateId, view.getState());
            cronkPanel.on('removed', function () {
                Ext.state.Manager.getProvider().clear(view.stateId);
            });
        },
        // private
        buildStores: function () {
            this.storeToChooseFrom = new Ext.data.JsonStore({
                autoDestroy: true,
                autoLoad: true,
                root: 'plots',
                fields: [
                    'id',
                    'host',
                    'service',
                    'parentService',
                    'plot'
                ],
                idProperty: 'id',
                url: Ext.ux.ingraph.Urls.provider.plots,
                baseParams: {
                    start: 0,
                    limit: 20
                },
                listeners: {
                    scope: this,
                    datachanged: function (storeToChooseFrom) {
                        var indexOf,
                            sm = this.gridToChooseFrom.getSelectionModel(),
                            rows = [];
                        sm.clearSelections(true); // True to suppress rowdeselect
                        storeToChooseFrom.each(function (record) {
                            indexOf = this.store.indexOfId(record.id);
                            if (indexOf !== -1) {
                                rows.push(storeToChooseFrom.indexOfId(
                                    record.id));
                            }
                        }, this);
                        sm.selectRows.defer(10, sm, [rows]);
                    }
                }
            });
            this.store = new Ext.data.JsonStore({
                autoDestroy: true,
                fields: [
                    'id',
                    'host',
                    'service',
                    'parentService',
                    'plot'
                ],
                idProperty: 'id',
                data: [],
                listeners: {
                    scope: this,
                    add: function (store, records, index) {
                        this.grid.getSelectionModel().selectAll.defer(
                            10, this.grid.getSelectionModel());
                    }
                }
            });
        },
        // private
        rowselectOfGridToChooseFrom: function (sm, rowIndex, record) {
            if (-1 === this.store.indexOfId(record.id)) {
                this.store.add(record);
            }
        },
        // private
        rowdeslectOfGridToChooseFrom: function (sm, rowIndex, record) {
            this.store.removeAt(this.store.indexOfId(record.id));
        },
        // private
        rowdeselect: function (sm, rowIndex, record) {
            this.gridToChooseFrom.getSelectionModel().deselectRow(
                this.storeToChooseFrom.indexOfId(record.id));
            this.store.removeAt(this.store.indexOfId(record.id));
        },
        // private
        buildItems: function (cfg) {
            var smOfGridToChooseFrom = new Ext.grid.CheckboxSelectionModel({
                listeners: {
                    scope: this,
                    rowselect: this.rowselectOfGridToChooseFrom,
                    rowdeselect: this.rowdeslectOfGridToChooseFrom
                }
            });
            var sm = new Ext.grid.CheckboxSelectionModel({
                listeners: {
                    scope: this,
                    rowdeselect: this.rowdeselect
                }
            });
            cfg.items = [
                {
                    ref: 'selectionContainer',
                    xtype: 'container',
                    layout: 'hbox',
                    layoutConfig: {
                        align: 'stretch',
                        pack: 'start'
                    },
                    defaults: {
                        flex: 1
                    },
                    items: [
                        {
                            xtype: 'grid',
                            ref: '../gridToChooseFrom',
                            store: this.storeToChooseFrom,
                            cm: new Ext.grid.ColumnModel({
                                defaults:
                                {
                                    width: 150,
                                    sortable: true
                                },
                                columns: [
                                    smOfGridToChooseFrom,
                                    {
                                        header: _('Host Name'),
                                        dataIndex: 'host'
                                    },
                                    {
                                        header: _('Service Name'),
                                        dataIndex: 'service'
                                    },
                                    {
                                        header: _('Parent Service Name'),
                                        dataIndex: 'parent_service'
                                    },
                                    {
                                        header: _('Plot Name'),
                                        dataIndex: 'plot'
                                    }
                                ]
                            }),
                            sm: smOfGridToChooseFrom,
                            tbar: [
                                _('Host:'),
                                {
                                    name: 'host',
                                    xtype: 'xigautocombo',
                                    ref: '../../hostCombo',
                                    emptyText: _('Choose host'),
                                    store: {
                                        xtype: 'arraystore',
                                        root: 'results',
                                        fields: ['host'],
                                        idProperty: 'host',
                                        url: Ext.ux.ingraph.Urls.provider.hosts
                                    },
                                    displayField: 'host',
                                    valueField: 'host',
                                    plugins: [
                                        new Ext.ux.StoreFilter({
                                            store: this.storeToChooseFrom,
                                            param: 'host'
                                        })
                                    ],
                                    width: 150
                                },
                                {
                                    xtype: 'box',
                                    autoEl: {
                                        tag: 'div',
                                        style: 'height: 19px; width: 17px; ' +
                                            'cursor: pointer; ' +
                                            'border: 0; ' +
                                            'background: transparent no-repeat 0 0; ' +
                                            'border-bottom: 1px solid #B5B8C8; ' +
                                            'background-image: url(js/ext3/resources/images/default/form/clear-trigger.gif);'
                                    },
                                    listeners: {
                                        single: true,
                                        scope: this,
                                        afterrender: function (ct) {
                                            ct.el.on({
                                                scope: this,
                                                click: function (e, el) {
                                                    var oldValue = this.selectionContainer.hostCombo.getValue();
                                                    this.selectionContainer.hostCombo.setValue('');
                                                    this.selectionContainer.hostCombo.fireEvent(
                                                        'change', this.selectionContainer.hostCombo, '', oldValue);
                                                }
                                            });
                                        }
                                    }
                                },
                                _('Service:'),
                                {
                                    name: 'service',
                                    xtype: 'xigautocombo',
                                    ref: '../../serviceCombo',
                                    emptyText: _('Choose service'),
                                    store: {
                                        xtype: 'jsonstore',
                                        root: 'results',
                                        fields: [
                                            'name',
                                            'service',
                                            'parentService'
                                        ],
                                        idProperty: 'name',
                                        url: Ext.ux.ingraph.Urls.provider.services
                                    },
                                    displayField: 'name',
                                    valueField: 'service',
                                    plugins: [
                                        new Ext.ux.ComboDependency({
                                            ref: 'hostCombo',
                                            param: 'host'
                                        }),
                                        new Ext.ux.StoreFilter({
                                            store: this.storeToChooseFrom,
                                            param: 'service'
                                        })
                                    ],
                                    width: 150
                                },
                                {
                                    xtype: 'box',
                                    autoEl: {
                                        tag: 'div',
                                        style: 'height: 19px; width: 17px; ' +
                                            'cursor: pointer; ' +
                                            'border: 0; ' +
                                            'background: transparent no-repeat 0 0; ' +
                                            'border-bottom: 1px solid #B5B8C8; ' +
                                            'background-image: url(js/ext3/resources/images/default/form/clear-trigger.gif);'
                                    },
                                    listeners: {
                                        single: true,
                                        scope: this,
                                        afterrender: function (ct) {
                                            ct.el.on({
                                                scope: this,
                                                click: function (e, el) {
                                                    var oldValue = this.selectionContainer.serviceCombo.getValue();
                                                    this.selectionContainer.serviceCombo.setValue('');
                                                    this.selectionContainer.serviceCombo.fireEvent(
                                                        'change', this.selectionContainer.serviceCombo, '', oldValue);
                                                }
                                            });
                                        }
                                    }
                                },
                                _('Plot:'),
                                {
                                    name: 'plot',
                                    xtype: 'xigautocombo',
                                    ref: '../../plotCombo',
                                    emptyText: _('Choose plot'),
                                    store: {
                                        xtype: 'jsonstore',
                                        root: 'plots',
                                        fields: [
                                            'id',
                                            'host',
                                            'service',
                                            'parentService',
                                            'plot'
                                        ],
                                        idProperty: 'plot',
                                        url: Ext.ux.ingraph.Urls.provider.plots
                                    },
                                    displayField: 'plot',
                                    valueField: 'plot',
                                    queryParam: 'plot',
                                    plugins: [
                                        new Ext.ux.ComboDependency({
                                            ref: 'hostCombo',
                                            param: 'host'
                                        }),
                                        new Ext.ux.ComboDependency({
                                            ref: 'serviceCombo',
                                            param: 'service'
                                        }),
                                        new Ext.ux.StoreFilter({
                                            store: this.storeToChooseFrom,
                                            param: 'plot'
                                        })
                                    ],
                                    width: 150
                                },
                                {
                                    xtype: 'box',
                                    autoEl: {
                                        tag: 'div',
                                        style: 'height: 19px; width: 17px; ' +
                                            'cursor: pointer; ' +
                                            'border: 0; ' +
                                            'background: transparent no-repeat 0 0; ' +
                                            'border-bottom: 1px solid #B5B8C8; ' +
                                            'background-image: url(js/ext3/resources/images/default/form/clear-trigger.gif);'
                                    },
                                    listeners: {
                                        single: true,
                                        scope: this,
                                        afterrender: function (ct) {
                                            ct.el.on({
                                                scope: this,
                                                click: function (e, el) {
                                                    var oldValue = this.selectionContainer.plotCombo.getValue();
                                                    this.selectionContainer.plotCombo.setValue('');
                                                    this.selectionContainer.plotCombo.fireEvent(
                                                        'change', this.selectionContainer.plotCombo, '', oldValue);
                                                }
                                            });
                                        }
                                    }
                                }
                            ],
                            bbar: {
                                xtype: 'paging',
                                store: this.storeToChooseFrom,
                                displayInfo: true,
                                pageSize: 20
                            }
                        },
                        {
                            xtype: 'grid',
                            ref: '../grid',
                            store: this.store,
                            cm: new Ext.grid.ColumnModel({
                                defaults:
                                {
                                    width: 150,
                                    sortable: true
                                },
                                columns: [
                                    sm,
                                    {
                                        header: _('Host Name'),
                                        dataIndex: 'host'
                                    },
                                    {
                                        header: _('Service Name'),
                                        dataIndex: 'service'
                                    },
                                    {
                                        header: _('Parent Service Name'),
                                        dataIndex: 'parent_service'
                                    },
                                    {
                                        header: _('Plot Name'),
                                        dataIndex: 'plot'
                                    }
                                ]
                            }),
                            sm: sm
                        }
                    ]
                },
                {
                    xtype: 'form',
                    ref: 'viewConfig',
                    labelAlign: 'top',
                    labelWidth: 100,
                    defaults: {
                        xtype: 'fieldset',
                        collapsible: true
                    },
                    items: [
                        {
                            title: _('View'),
                            defaults: {
                                xtype: 'container',
                                layout: 'hbox',
                                layoutConfig: {
                                    align: 'pack',
                                    stretch: 'start'
                                }
                            },
                            items: [
                                {
                                    defaults: {
                                        xtype: 'container',
                                        layout: 'form',
                                        flex: 1
                                    },
                                    items: [
                                        {
                                            items: [
                                                {
                                                    name: 'title',
                                                    xtype: 'textfield',
                                                    fieldLabel: _('Title'),
                                                    emptyText: _('Title'),
                                                    anchor: '95%'
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    xtype: 'container',
                                                    anchor: '95%'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            title: _('Range'),
                            defaults: {
                                xtype: 'container',
                                layout: 'hbox',
                                layoutConfig: {
                                    align: 'pack',
                                    stretch: 'start'
                                }
                            },
                            items: [
                                {
                                    defaults: {
                                        xtype: 'container',
                                        layout: 'form',
                                        flex: 1
                                    },
                                    items: [
                                        {
                                            items: [
                                                {
                                                    name: 'start',
                                                    ref: '../../../../startDateField',
                                                    xtype: 'datefield',
                                                    format: 'Y-m-d H:i:s',
                                                    emptyText: _('Starttime'),
                                                    qtip: this.dateText,
                                                    fieldLabel: _('Starttime'),
                                                    anchor: '95%'
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'end',
                                                    ref: '../../../../endDateField',
                                                    xtype: 'datefield',
                                                    format: 'Y-m-d H:i:s',
                                                    emptyText: _('Endtime'),
                                                    maxValue: new Date(),
                                                    qtip: this.dateText,
                                                    fieldLabel: _('Endtime'),
                                                    anchor: '95%'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    defaults: {
                                        xtype: 'container',
                                        layout: 'form',
                                        flex: 1
                                    },
                                    items: [
                                        {
                                            items: [
                                                {
                                                    name: 'interval',
                                                    xtype: 'xigautocombo',
                                                    fieldLabel: _('Interval'),
                                                    emptyText: _('Interval'),
                                                    anchor: '95%',
                                                    store: {
                                                        xtype: 'jsonstore',
                                                        root: 'results',
                                                        fields: [
                                                            'id',
                                                            'interval',
                                                            'retention-period'
                                                        ],
                                                        idProperty: 'id',
                                                        url: Ext.ux.ingraph.Urls.provider.intervals
                                                    },
                                                    displayField: 'interval',
                                                    valueField: 'interval',
                                                    forceSelection: true
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'autorefresh',
                                                    xtype: 'xigautocombo',
                                                    fieldLabel: _('Auto-refresh'),
                                                    emptyText: _('Auto-refresh'),
                                                    anchor: '95%',
                                                    mode: 'local',
                                                    store: [1, 5],
                                                    forceSelection: true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            title: _('Plots'),
                            defaults: {
                                xtype: 'container',
                                layout: 'hbox',
                                layoutConfig: {
                                    align: 'pack',
                                    stretch: 'start'
                                }
                            },
                            items: [
                                {
                                    defaults: {
                                        xtype: 'container',
                                        layout: 'form',
                                        flex: 1
                                    },
                                    items: [
                                        {
                                            items: [
                                                {
                                                    name: 'groupby',
                                                    xtype: 'xigautocombo',
                                                    emptyText: _('Group By'),
                                                    fieldLabel: _('Group By'),
                                                    anchor: '95%',
                                                    store: ['id',
                                                            'host',
                                                            'service',
                                                            'parentService',
                                                            'plot'],
                                                    forceSelection: true
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'chartType',
                                                    xtype: 'xigautocombo',
                                                    emptyText: _('Chart Type'),
                                                    fieldLabel: _('Chart Type'),
                                                    anchor: '95%',
                                                    mode: 'local',
                                                    store: ['Line Chart',
                                                            'Bar Chart',
                                                            'Area Chart',
                                                            'Bar Area Chart'],
                                                    forceSelection: true
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    defaults: {
                                        xtype: 'container',
                                        layout: 'form',
                                        flex: 1
                                    },
                                    items: [
                                        {
                                            items: [
                                                {
                                                    name: 'type',
                                                    xtype: 'xigautocombo',
                                                    fieldLabel: _('Function'),
                                                    emptyText: _('Function'),
                                                    anchor: '95%',
                                                    mode: 'local',
                                                    store: ['avg', 'min', 'max'],
                                                    forceSelection: true
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    xtype: 'container',
                                                    anchor: '95%'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ];
        }
    });
    Ext.reg('xiviewarchitect', Ext.ux.ingraph.ViewArchitect);
}());
