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

/*jshint browser: true */
/*global _, Ext, strtotime */

(function () {
    'use strict';
    Ext.ns('Ext.ux.flot');
    Ext.ux.flot.Tbar = Ext.extend(Ext.Toolbar, {
        /**
         * Whether to show the paging controls.
         */
        showDataView: true,
        /**
         * Whether to show the calendar button.
         */
        showCalendar: true,
        /**
         * Whether to show the refresh button.
         */
        showRefresh: true,
        /**
         * Whether to show the sync button.
         */
        showSync: true,
        /**
         * Whether to show the combobox to enable/disable datapoints.
         */
        showDatapoints: true,
        /**
         * Whether to show the combobox to enable/disable period averages.
         */
        showPeriodAverage: true,
        /**
         * Whether to show the combobox to enable/disable spline.
         */
        showSmooth: false,
        /**
         * Whether to show the settings button.
         */
        showSettings: true,
        /**
         * Whether to show the comments button.
         */
        showComments: false,
        /**
         * Whether to show the prediction button.
         */
        showPrediction: true,
        /**
         * Whether to show the export controls.
         */
        showExport: true,
        /**
         * @cfg {Boolean} prependButtons
         * Whether to insert any configured <tt>items</tt> or <tt>buttons</tt>
         * <i>before</i> the built-in controls. Defaults to <tt>false</tt>.
         */
        /**
         * The quicktip text displayed for the paging controls if no data view selected.
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        pageTextIfDisabled: _('Please choose a data view first'),

        /**
         * The quicktip text displayed for the paging controls if older data not available.
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        prevTextIfMin: _('Older data not available'),
        /**
         * The quicktip text displayed for the start of availabe data button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        firstText: new Ext.XTemplate(
            _('Start of available {adv} data'), {compiled: true}
        ),
        /**
         * The quicktip text displayed for the backward button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        prevText: new Ext.XTemplate(
            _('Back {[values.name.toLowerCase()]}'), {compiled: true}
        ),
        /**
         * The quicktip text displayed for the input combobox
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        inputText: _('Choose data view'),
        /**
         * The quicktip text displayed for the forward button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        nextText: new Ext.XTemplate(
            _('Forward {[values.name.toLowerCase()]}'), {compiled: true}
        ),
        /**
         * The quicktip text displayed for the last available data button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        lastText: new Ext.XTemplate(
            _('Latest available {adv} data'), {compiled: true}
        ),
        /**
         * The quicktip text displayed for the calendar button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        calendarText: _('Change start and end point'),
        /**
         * The quicktip text displayed for the start and end datefield.
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
        /**
         * The quicktip text displayed for the refresh button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        refreshText: _('Reload chart'),
        /**
         * The quicktip text displayed for the sync button (defaults to
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        syncText: _('Synchronize start and end points of all charts with this ' +
            'chart'),
        /**
         * The quicktip text displayed for the settings button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        settingsText: _('Change settings of this chart'),
        /**
         * The quicktip text displayed for the comments button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        commentsText: _('Add comment to this chart'),
        /**
         * The quicktip text displayed for the prediction button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        predictionText: _(''),
        /**
         * The quicktip text displayed for the download button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        downloadText: _('Export data'),
        /**
         * The quicktip text displayed for the print button
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        printText: _('Print chart'),
        bubbleEvents: ['sync', 'add', 'remove'],
        // private override
        initComponent: function () {
            var cfg = {};
            this.buildItems(cfg);
            Ext.apply(this, Ext.apply(this.initialConfig, cfg));
            Ext.ux.flot.Tbar.superclass.initComponent.call(this);
            this.addEvents(
                /**
                 * @event sync
                 * Fires after the sync button is clicked.
                 * @param {Ext.ux.flot.Tbar} this
                 * @param {String|Number} start
                 * @param {String|Number} end
                 */
                'sync'
            );
            this.bindStore(this.store, true);
        },
        // private
        buildItems: function (cfg) {
            var items = [
                {
                    ref: 'first',
                    tooltip: this.pageTextIfDisabled,
                    iconCls: 'x-tbar-page-first',
                    disabled: true,
                    handler: this.moveFirst,
                    scope: this,
                    hidden: !this.showDataView
                },
                {
                    ref: 'prev',
                    tooltip: this.pageTextIfDisabled,
                    iconCls: 'x-tbar-page-prev',
                    disabled: true,
                    handler: this.movePrevious,
                    scope: this,
                    hidden: !this.showDataView
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showDataView
                },
                {
                    xtype: 'container',
                    width: 130,
                    items: {
                        ref: '../input',
                        xtype: 'combo',
                        emptyText: _('Choose data view'),
                        width: 130,
                        store: {
                            xtype: 'jsonstore',
                            autoDestroy: true,
                            root: 'frames',
                            idProperty: 'name',
                            fields: [
                                'name',
                                'start',
                                {
                                    'name': 'end',
                                    defaultValue: 'now'
                                },
                                {
                                    'name': 'overview',
                                    defaultValue: false
                                },
                                {
                                    'name': 'enabled',
                                    defaultValue: true
                                },
                                'adv'
                            ],
                            data: {
                                frames: [
                                    {
                                        name: _('One Hour'),
                                        start: '-1 hour',
                                        enabled: false,
                                        adv: _('hourly')
                                    },
                                    {
                                        name: _('Four Hours'),
                                        start: '-4 hours',
                                        overview: true,
                                        adv: _('four-hourly')
                                    },
                                    {
                                        name: _('One Day'),
                                        start: '-1 day',
                                        adv: _('daily')
                                    },
                                    {
                                        name: _('One Week'),
                                        start: '-1 week',
                                        adv: _('weekly')
                                    },
                                    {
                                        name: _('One Month'),
                                        start: '-1 month',
                                        adv: _('monthly')
                                    },
                                    {
                                        name: _('One Year'),
                                        start: '-1 year',
                                        adv: _('yearly')
                                    }
                                ]
                            },
                            listeners: {
                                single: true,
                                load: function (store) {
                                    store.each(function (rec) {
                                        rec.set('interval', strtotime(rec.get('end')) -
                                                            strtotime(rec.get('start')));
                                    });
                                }
                            }
                        },
                        valueField: 'name',
                        displayField: 'name',
                        mode: 'local',
                        triggerAction: 'all',
                        listeners: {
                            scope: this,
                            select: this.onSelectDataView,
                            render: function (combo) {
                                Ext.QuickTips.register({
                                    text: this.inputText,
                                    target: combo.el
                                });
                                var recordIndex = combo.store.find('start', this.activeFrame);
                                if (recordIndex !== -1) {
                                    var record = combo.store.getAt(recordIndex);
                                    combo.setValue(record.get('name'));
                                    this.onSelectDataView(combo, record, false);
                                }
                            }
                        },
                        hidden: !this.showDataView
                    }
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showDataView
                },
                {
                    ref: 'next',
                    tooltip: this.pageTextIfDisabled,
                    iconCls: 'x-tbar-page-next',
                    disabled: true,
                    handler: this.moveNext,
                    scope: this,
                    hidden: !this.showDataView
                },
                {
                    ref: 'last',
                    tooltip: this.pageTextIfDisabled,
                    iconCls: 'x-tbar-page-last',
                    disabled: true,
                    handler: this.moveLast,
                    scope: this,
                    hidden: !this.showDataView
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showDataView
                },
                {
                    iconCls: 'x-flot-calendar-icon',
                    tooltip: this.calendarText,
                    scope: this,
                    handler: this.calendarHandler,
                    hidden: !this.showCalendar
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showCalendar
                },
                {
                    ref: 'refresh',
                    tooltip: this.refreshText,
                    iconCls: 'x-tbar-loading',
                    disabled: true,
                    handler: this.doRefresh,
                    scope: this,
                    hidden: !this.showRefresh
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showRefresh
                },
                {
                    ref: 'sync',
                    tooltip: this.syncText,
                    iconCls: 'x-flot-sync-icon',
                    disabled: true,
                    handler: this.syncHandler,
                    scope: this,
                    hidden: !this.showSync
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showSync
                },
                {
                    ref: 'datapoints',
                    xtype: 'checkbox',
                    boxLabel: _('Show datapoints'),
                    disabled: true,
                    scope: this,
                    handler: this.datapointsHandler,
                    style: {
                        marginTop: '0px'
                    },
                    hidden: !this.showDatapoints
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showDatapoints
                },
                {
                    ref: 'periodAverage',
                    xtype: 'checkbox',
                    boxLabel: _('Show average'),
                    disabled: true,
                    scope: this,
                    handler: this.periodAverageHandler,
                    style: {
                        marginTop: '0px'
                    },
                    hidden: !this.showPeriodAverage
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showPeriodAverage
                },
                {
                    ref: 'smooth',
                    xtype: 'checkbox',
                    boxLabel: _('Smooth'),
                    disabled: true,
                    scope: this,
                    handler: this.smoothHandler,
                    style: {
                        marginTop: '0px'
                    },
                    hidden: !this.showSmooth
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showSmooth
                },
                {
                    ref: 'settings',
                    tooltip: this.settingsText,
                    iconCls: 'x-flot-settings-icon',
                    scope: this,
                    handler: this.settingsHandler,
                    hidden: !this.showSettings
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showComments
                },
                {
                    ref: 'comments',
                    tooltip: this.commentsText,
                    iconCls: 'x-flot-comment-icon',
                    scope: this,
                    handler: this.commentsHandler,
                    hidden: !this.showComments
                },
                {
                    xtype: 'tbseparator',
                    hidden: !this.showPrediction
                },
                {
                    ref: 'prediction',
                    tooltip: this.predictionText,
                    iconCls: 'x-flot-forecast-icon',
                    scope: this,
                    handler: this.predictionHandler,
                    hidden: !this.showPrediction
                },
                {
                    xtype: 'tbfill',
                    hidden: !this.showExport
                },
                {
                    ref: 'download',
                    tooltip: this.downloadText,
                    iconCls: 'x-flot-document-export-icon',
                    menu: {
                        items: [
                            {
                                text: 'XML',
                                iconCls: 'x-flot-document-xml-icon',
                                handler: this.doDownload.createDelegate(this, ['xml'])
                            },
                            {
                                text: 'CSV',
                                iconCls: 'x-flot-document-csv-icon',
                                handler: this.doDownload.createDelegate(this, ['csv'])
                            },
                            {
                                text: 'PNG',
                                iconCls: 'x-flot-export-image-icon',
                                handler: this.doDownload.createDelegate(this, ['png'])
                            }
                        ]
                    },
                    hidden: !this.showExport
                },
                {
                    ref: 'print',
                    tooltip: this.printText,
                    iconCls: 'x-flot-print-icon',
                    scope: this,
                    handler: this.printHandler,
                    hidden: !this.showExport
                }
            ];
            var userItems = this.items || this.buttons;
            if (Ext.isArray(userItems)) {
                if (this.prependButtons) {
                    items = userItems.concat(items);
                } else {
                    items = items.concat(userItems);
                }
            }
            delete this.buttons;
            cfg.items = items;
        },
        // private
        calendarHandler: function () {
            new Ext.Window({
                title: _('Start, End'),
                layout: 'fit',
                width: 250,
                height: 125,
                modal: true,
                bodyStyle: 'padding: 5px;',
                items: [
                    {
                        xtype: 'form',
                        ref: 'form',
                        baseCls: 'x-plain',
                        labelWidth: 70,
                        defaults: {
                            xtype: 'datefield',
                            allowBlank: false,
                            width: 150,
                            format: 'Y-m-d H:i:s'
                        },
                        items: [
                            {
                                name: 'startx',
                                fieldLabel: String.format(
                                    '<span ext:qtip="{0}">{1}</span>',
                                    Ext.util.Format.htmlEncode(this.dateText),
                                    _('Start')
                                ),
                                emptyText: _('Starttime')
                            },
                            {
                                name: 'endx',
                                fieldLabel: String.format(
                                    '<span ext:qtip="{0}">{1}</span>',
                                    Ext.util.Format.htmlEncode(this.dateText),
                                    _('End')
                                ),
                                emptyText: _('Endtime')
                            }
                        ],
                        monitorValid: true,
                        listeners: {
                            clientvalidation: function (form, valid) {
                                // form -> window -> ref of apply
                                form.ownerCt.applyBtn.setDisabled(!valid);
                            }
                        }
                    }
                ],
                buttons: [
                    {
                        text: _('Apply'),
                        iconCls: 'x-flot-accept-icon',
                        ref: '../applyBtn',
                        disabled: true,
                        scope: this,
                        handler: function (btn) {
                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt,
                                form = win.form.getForm(),
                                startDateField = form.findField('startx'),
                                endDateField = form.findField('endx'),
                                start = startDateField.strValue ||
                                        startDateField.getValue() ?
                                            startDateField.getValue().getTime() / 1000 :
                                            null,
                                end = endDateField.strValue ||
                                        endDateField.getValue() ?
                                            endDateField.getValue().getTime() / 1000 :
                                            null;
                            this.store.load({
                                params: {
                                    startx: start,
                                    endx: end
                                }
                            });
                            // Hide or destroy window based on its config
                            win[win.closeAction]();
                        }
                    },
                    {
                        text: _('Cancel'),
                        iconCls: 'x-flot-cancel-icon',
                        scope: this,
                        handler: function (btn) {
                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt;
                            // Hide or destroy window based on its config
                            win[win.closeAction]();
                        }
                    }
                ]
            }).show();
        },
        // private
        datapointsHandler: function (box, checked) {
            // TODO(el): Use the template store
            this.store.each(function (rec) {
                rec.set('points:show', checked);
            });
        },
        // private
        periodAverageHandler: function (box, checked) {
            this.ownerCt.flot.periodAverage = checked;
            this.ownerCt.flot.plot();
        },
        // private
        smoothHandler: function (box, checked) {
            // TODO(el): Use the template store
            this.store.each(function (rec) {
                rec.set('lines:spline', checked);
            });
        },
        // private
        settingsHandler: function () {
            new Ext.Window({
                title: _('Settings'),
                layout: 'fit',
                width: 560,
                height: 300,
                collapsible: true,
                modal: true,
                items: [
                    {
                        xtype: 'xflotconfig',
                        unstyled: true,
                        store: this.ownerCt.template,
                        ref: 'flotConfiguration'
                    }
                ],
                buttons: [
                    {
                        text: _('Apply'),
                        iconCls: 'x-flot-accept-icon',
                        scope: this,
                        handler: function (btn) {
                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt,
                                store = win.flotConfiguration.store;
                            store.commitChanges();
                            store.yaxes.commitChanges();
                            // Hide or destroy window based on its config
                            win[win.closeAction]();
                        }
                    },
                    {
                        text: _('Cancel'),
                        iconCls: 'x-flot-cancel-icon',
                        scope: this,
                        handler: function (btn) {
                            // TODO(el): Check for unapplied changes
                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt;
                            // Hide or destroy window based on its config
                            win[win.closeAction]();
                        }
                    },
                    {
                        text: _('Reset'),
                        iconCls: 'x-flot-reset-icon',
                        scope: this,
                        handler: function (btn) {
                            // TODO(el): Check for unapplied changes
                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt,
                                store = win.flotConfiguration.store;
                            store.rejectChanges();
                            store.yaxes.rejectChanges();
                        }
                    }
                ]
            }).show();
        },
        // private
        commentsHandler: Ext.emptyFn,
        // private
        predictionHandler: function () {
            new Ext.ux.flot.FormWindow({
                title: _('Prediction'),
                width: 640,
                height: 450,
                items: {
                    baseCls: 'x-plain',
                    xtype: 'form',
                    ref: 'form',
                    labelAlign: 'top',
                    labelWidth: 100,
                    monitorValid: true,
                    defaults: {
                        xtype: 'fieldset',
                        collapsible: true
                    },
                    items: [
                        {
                            title: _('Datasource'),
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
                                                    name: 'plot',
                                                    xtype: 'xigautocombo',
                                                    fieldLabel: _('Plot'),
                                                    emptyText: _('Plot'),
                                                    store: this.store.data.keys,
                                                    mode: 'local',
                                                    anchor: '95%',
                                                    allowBlank: false
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'label',
                                                    fieldLabel: _('Title'),
                                                    xtype: 'textfield',
                                                    value: _('Forecast'),
                                                    anchor: '95%'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            title: _('Forecast'),
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
                                                    name: 'end',
                                                    ref: '../../../endDateField',
                                                    xtype: 'datefield',
                                                    minValue: new Date(),
                                                    format: 'Y-m-d H:i:s',
                                                    emptyText: _('Endtime'),
                                                    qtip: this.dateText,
                                                    fieldLabel: _('Endtime'),
                                                    anchor: '95%',
                                                    allowBlank: false
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'seasons',
                                                    fieldLabel: _('Seasons'),
                                                    xtype: 'spinnerfield',
                                                    minValue: 1,
                                                    anchor: '95%'
                                                }
                                            ]
                                        }
                                    ]
                                 }
                             ]
                        },
                        {
                            title: _('Style'),
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
                                                    xtype: 'xcolorfield',
                                                    lazyInit: false,
                                                    fieldLabel: _('Color'),
                                                    name: 'color',
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
                            title: _('Smoothing Constants'),
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
                                                    name: 'alpha',
                                                    fieldLabel: _('Alpha'),
                                                    xtype: 'numberfield',
                                                    min: 0,
                                                    max: 1,
                                                    anchor: '95%',
                                                    decimalPrecision: -1,
                                                    value: 0.1
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'beta',
                                                    fieldLabel: _('Beta'),
                                                    xtype: 'numberfield',
                                                    min: 0,
                                                    max: 1,
                                                    anchor: '95%',
                                                    decimalPrecision: -1,
                                                    value: 0.1
                                                }
                                            ]
                                        },
                                        {
                                            items: [
                                                {
                                                    name: 'gamma',
                                                    fieldLabel: _('Gamma'),
                                                    xtype: 'numberfield',
                                                    min: 0,
                                                    max: 1,
                                                    anchor: '95%',
                                                    decimalPrecision: -1,
                                                    value: 0.0035
                                                }
                                            ]
                                        }
                                    ]
                                 }
                             ]
                         }
                    ]
                },
                listeners: {
                    scope: this,
                    apply: function (w, values) {
                        this.ownerCt.flot.prediction = {
                            plot: values.plot,
                            end: w.form.endDateField.getValue() ?
                                w.form.endDateField.getValue().getTime() : null,
                            color: values.color,
                            smoothingConstants: {
                                alpha: values.alpha !== '' ? values.alpha : null,
                                beta: values.beta !== '' ? values.beta : null,
                                gamma: values.gamma !== '' ? values.gamma : null
                            },
                            label: values.label,
                            seasons: values.seasons !== '' ? values.seasons : null
                        };
                        this.ownerCt.flot.plot();
                    }
                }
            }).show();
        },
        // private
        printHandler: function () {
            var flotPanel = this.ownerCt,
                printContainer = Ext.getBody().select('div.x-flot-print-ct');
            printContainer.each(function (ct) {
                ct.destroy();
            });
            flotPanel.preparePrint();
            window.print();
        },
        // private
        syncHandler: function () {
            var startx = (this.store.lastOptions.params &&
                        this.store.lastOptions.params.startx) ||
                        this.store.baseParams.startx,
                endx = (this.store.lastOptions.params &&
                        this.store.lastOptions.params.endx) ||
                        this.store.baseParams.endx;
            this.fireEvent('sync', this, startx, endx);
        },
        /**
         * Changes the data store bound to this toolbar and refreshes it.
         * @param {Store} store The store to bind to this toolbar.
         * @param {Boolean} initial (Optional) <tt>true</tt> to not remove listeners.
         */
        bindStore: function (store, initial) {
            if (store) {
                store = Ext.StoreMgr.lookup(store);
            }
            if (!initial && this.store) {
                if (store !== this.store && this.store.autoDestroy) {
                    this.store.destroy();
                } else {
                    this.store.un('beforeload', this.onBeforeLoad, this);
                    this.store.un('load', this.onLoad, this);
                    this.store.un('exception', this.onLoadError, this);
                }
                if (!store) {
                    this.store = null;
                }
            }
            if (store) {
                store.on({
                    scope: this,
                    beforeload: this.onBeforeLoad,
                    load: this.onLoad,
                    exception: this.onLoadError
                });
                this.store = store;
            }
        },
        // private
        onBeforeLoad: function () {
            if (this.rendered && this.refresh) {
                this.refresh.disable();
            }
            this.lastFrame = this.input.getValue();
        },
        // private
        onLoad: function () {
            this.refresh.enable();
            this.sync.enable();
            this.datapoints.enable();
            this.smooth.enable();
            this.periodAverage.enable();
            if (this.input.getValue()) {
                if (this.store.getStartX() <= this.store.getMinX()) {
                    this.first.disable();
                    this.prev.disable();
                    this.first.setTooltip(this.prevTextIfMin);
                    this.prev.setTooltip(this.prevTextIfMin);
                } else {
                    this.first.enable();
                    this.prev.enable();
                }
                this.next.enable();
                this.last.enable();
            }
        },
        // private
        onLoadError: function () {
            if (this.rendered) {
                this.refresh.enable();
            }
        },
        /**
         * Reloads the store. Has the same effect as clicking the 'refresh' button.
         */
        doRefresh: function () {
            this.store.reload();
        },
        /**
         * Moves to the start of available data based on the selected data view.
         * Has the same effect as clicking the 'first' button.
         */
        moveFirst: function () {
            var rec = this.input.store.getById(this.input.getValue());
            if (rec) {
                var s = this.store.getMinX() * 1000,
                    i = rec.get('interval') * 1000,
                    e = s + i;
                this.store.load({
                    params: {
                        startx: Math.ceil(s / 1000),
                        endx: Math.ceil(e / 1000),
                        interval: null
                    }
                });
            }
        },

        /**
         * Backwards based on the selected data view.
         * Has the same effect as clicking the 'previous' button.
         */
        movePrevious: function () {
            var rec = this.input.store.getById(this.input.getValue());
            if (rec) {
                var e = this.store.getStartX() * 1000,
                    i = rec.get('interval') * 1000,
                    s = e - i,
                    min = this.store.getMinX() * 1000;
                if (s < min) {
                    s = min;
                    e = s + i;
                }
                this.store.load({
                    params: {
                        startx: Math.ceil(s / 1000),
                        endx: Math.ceil(e / 1000),
                        interval: null
                    }
                });
            }
        },
        // private
        onSelectDataView: function (c, rec, doLoad) {
            if (rec.get('name') !== this.lastFrame) {
                this.first.setTooltip(this.firstText.apply(rec.data));
                this.prev.setTooltip(this.prevText.apply(rec.data));
                this.next.setTooltip(this.nextText.apply(rec.data));
                this.last.setTooltip(this.lastText.apply(rec.data));
            }
            if (doLoad !== false) {
                this.store.load({
                    params: {
                        startx: Math.ceil(strtotime(rec.get('start'))),
                        endx: Math.ceil(strtotime('now')),
                        interval: null
                    }
                });
            }
        },
        /**
         * Forwards based on the selected data view.
         * Has the same effect as clicking the 'next' button.
         */
        moveNext: function () {
            var rec = this.input.store.getById(this.input.getValue());
            if (rec) {
                var s = this.store.getEndX() * 1000,
                    i = rec.get('interval') * 1000,
                    e = s + i,
                    now = new Date().getTime();
                if (e > now) {
                    e = now; // Do not try to plot future values. ;-)
                }
                if ((e - s) < i) {
                    s = e - i; // ALWAYS view full selected range.
                }
                this.store.load({
                    params: {
                        startx: Math.ceil(s / 1000),
                        endx: Math.ceil(e / 1000),
                        interval: null
                    }
                });
            }
        },
        /**
         * Moves to latest available data based on the selected data view.
         * Has the same effect as clicking the 'last' button.
         */
        moveLast: function () {
            var rec = this.input.store.getById(this.input.getValue());
            if (rec) {
                this.store.load({
                    params: {
                        startx: Math.ceil(strtotime(rec.get('start'))),
                        endx: Math.ceil(strtotime(rec.get('end'))),
                        interval: null
                    }
                });
            }
        },
        /**
         * Downloads values.
         * @param {String} ot Output type of the download.
         * <b>Note</b>: This is a template method and should be overwritten.
         */
        doDownload: Ext.emptyFn,
        // private override
        onDestroy: function () {
            this.bindStore(null);
            Ext.ux.flot.Tbar.superclass.onDestroy.call(this);
        }
    });
    Ext.reg('xflottbar', Ext.ux.flot.Tbar);
}());
