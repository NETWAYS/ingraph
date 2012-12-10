/**
 * Ext.ux.flot.Tbar
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
     * @class Ext.ux.flot.Tbar
     * @extends Ext.Toolbar
     * @namespace Ext.ux.flot
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xflottbar
     */
    Ext.ux.flot.Tbar = Ext.extend(Ext.Toolbar, {
        /**
         * @cfg {Boolean} showDataView
         * Whether to show the paging controls. Defaults to <tt>true</tt>.
         */
        showDataView: true,

        /**
         * @cfg {Boolean} showCalendar
         * Whether to show the calendar button. Defaults to <tt>true</tt>.
         */
        showCalendar: true,

        /**
         * @cfg {Boolean} showRefresh
         * Whether to show the refresh button. Defaults to <tt>true</tt>.
         */
        showRefresh: true,

        /**
         * @cfg {Boolean} showSync
         * Whether to show the sync button. Defaults to <tt>true</tt>.
         */
        showSync: true,

        /**
         * @cfg {Boolean} showDatapoints
         * Whether to show the combobox to enable/disable datapoints.
         * Defaults to <tt>true</tt>.
         */
        showDatapoints: true,

        showPeriodAverage: true,

        /**
         * @cfg {Boolean} showSmooth
         * Whether to show the combobox to enable/disable spline.
         * Defaults to <tt>false</tt>.
         */
        showSmooth: false,

        /**
         * @cfg {Boolean} showSettings
         * Whether to show the settings button. Defaults to <tt>true</tt>.
         */
        showSettings: true,

        /**
         * @cfg {Boolean} showComments
         * Whether to show the comments button. Defaults to <tt>true</tt>.
         */
        showComments: false,

        showPrediction: true,

        /**
         * @cfg {Boolean} showExport
         * Whether to show the export controls. Defaults to <tt>true</tt>.
         */
        showExport: true,

        /**
         * @cfg {Boolean} prependButtons
         * Whether to insert any configured <tt>items</tt> or <tt>buttons</tt>
         * <i>before</i> the built-in controls. Defaults to <tt>false</tt>.
         */

        /**
         * @cfg {String} pageTextIfDisabled
         * The quicktip text displayed for the paging controls if no data view selected.
         * (defaults to <tt>'Please choose a data view first'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        pageTextIfDisabled: _('Please choose a data view first'),

        /**
         * @cfg {String} prevTextIfMin
         * The quicktip text displayed for the paging controls if older data not available.
         * (defaults to <tt>'Older data not available'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        prevTextIfMin: _('Older data not available'),

        /**
         * @cfg {String|Ext.XTemplate} firstText
         * The quicktip text displayed for the start of availabe data button
         * (defaults to <tt>'Start of available {adv} data'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        firstText: new Ext.XTemplate(
            _('Start of available {adv} data'), {compiled: true}),

        /**
         * @cfg {String|Ext.XTemplate} prevText
         * The quicktip text displayed for the backward button
         * (defaults to <tt>'Back {[values.name.toLowerCase()]}'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        prevText: new Ext.XTemplate(
            _('Back {[values.name.toLowerCase()]}'), {compiled: true}),

        /**
         * @cfg {String} inputText
         * The quicktip text displayed for the input combobox
         * (defaults to <tt>'Choose data view'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        inputText: _('Choose data view'),

        /**
         * @cfg {String|Ext.XTemplate} nextText
         * The quicktip text displayed for the forward button
         * (defaults to <tt>'Forward {[values.name.toLowerCase()]}'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        nextText: new Ext.XTemplate(
            _('Forward {[values.name.toLowerCase()]}'), {compiled: true}),

        /**
         * @cfg {String|Ext.XTemplate} lastText
         * The quicktip text displayed for the last available data button
         * (defaults to <tt>'Latest available {adv} data'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        lastText: new Ext.XTemplate(
            _('Latest available {adv} data'), {compiled: true}),

        /**
         * @cfg {String} calendarText
         * The quicktip text displayed for the calendar button
         * (defaults to <tt>'Change start and end point'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        calendarText: _('Change start and end point'),

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

        /**
         * @cfg {String} refreshText
         * The quicktip text displayed for the refresh button
         * (defaults to <tt>'Reload chart'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        refreshText: _('Reload chart'),

        /**
         * @cfg {String} syncText
         * The quicktip text displayed for the sync button (defaults to
         * <tt>'Synchronize start and end points of all charts with this chart'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        syncText: _('Synchronize start and end points of all charts with this ' +
                    'chart'),

        /**
         * @cfg {String} settingsText
         * The quicktip text displayed for the settings button
         * (defaults to <tt>'Change settings of this chart'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        settingsText: _('Change settings of this chart'),

        /**
         * @cfg {String} commentsText
         * The quicktip text displayed for the comments button
         * (defaults to <tt>'Add comment to this chart'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        commentsText: _('Add comment to this chart'),

        predictionText: _(''),

        /**
         * @cfg {String} downloadText
         * The quicktip text displayed for the download button
         * (defaults to <tt>'Export data'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        downloadText: _('Export data'),

        /**
         * @cfg {String} printText
         * The quicktip text displayed for the print button
         * (defaults to <tt>'Print chart'</tt>).
         * <b>Note</b>: quick tips must be initialized for the quicktip to show.
         */
        printText: _('Print chart'),

        /**
         * @cfg {Array} bubbleEvents
         * An array of events that, when fired, should be bubbled to any parent container.
         * Defaults to <tt>['sync', 'add', 'remove']</tt>.
         */
        bubbleEvents: ['sync', 'add', 'remove'],

        // private
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
                    ref: 'input',
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
                            ] // Eof frames
                        }, // Eof data
                        listeners: {
                            single: true,
                            load: function (store) {
                                store.each(function (rec) {
                                    rec.set('interval', strtotime(rec.get('end')) -
                                                        strtotime(rec.get('start')));
                                });
                            }
                        }
                    }, // Eof store
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
                }, // Eof data view combo
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
                    iconCls: 'xflot-icon-calendar',
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
                    iconCls: 'xflot-icon-sync',
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
                    iconCls: 'xflot-icon-settings',
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
                    iconCls: 'xflot-icon-comment',
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
                    iconCls: 'xflot-icon-document-export',
                    menu: {
                        items: [
                            {
                                text: 'XML',
                                iconCls: 'xflot-icon-document-xml',
                                handler: this.doDownload.createDelegate(this, ['xml'])
                            },
                            {
                                text: 'CSV',
                                iconCls: 'xflot-icon-document-csv',
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
                    iconCls: 'xflot-icon-print',
                    scope: this,
                    handler: this.printHandler,
                    hidden: !this.showExport
                }
            ]; // Eof items

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
            var win = new Ext.Window({
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
                                var applyBtn = form.ownerCt.applyBtn;

                                applyBtn.setDisabled(!valid);
                            }
                        }
                    } // Eof form
                ], // Eof window items
                buttons: [
                    {
                        text: _('Apply'),
                        iconCls: 'xflot-icon-accept',
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
                        iconCls: 'xflot-icon-cancel',
                        scope: this,
                        handler: function (btn) {
                            // Button -> Tbar -> Window
                            var win = btn.ownerCt.ownerCt;

                            // Hide or destroy window based on its config
                            win[win.closeAction]();
                        }
                    }
                ]
            });

            win.show();
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
            var settingsWindow = new Ext.Window({
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
                        iconCls: 'xflot-icon-accept',
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
                        iconCls: 'xflot-icon-cancel',
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
                        iconCls: 'xflot-icon-reset',
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
                ] // Eof buttons
            }); // Eof new settings window
            settingsWindow.show();
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
                                                    store: this.store.collect('id'),
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
                                                    anchor: '95%'
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
                                                    anchor: '95%'
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
                                                    anchor: '95%'
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
                        }
                        this.ownerCt.flot.plot();
                    }
                }
            }).show();
        },

        // private
        printHandler: function () {
            var flotPanel = this.ownerCt;

            var printContainer = Ext.getBody().select('div.flot-print-container');
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
         * Change the data store bound to this toolbar and refresh it.
         * @method bindStore
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
                    this.store.purgeListeners();
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
         * Reload the store. Has the same effect as clicking the 'refresh' button.
         * @method doRefresh
         */
        doRefresh: function () {
            this.store.reload();
        },

        /**
         * Move to the start of available data based on the selected data view.
         * Has the same effect as clicking the 'first' button.
         * @method moveFirst
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
         * Backward based on the selected data view.
         * Has the same effect as clicking the 'previous' button.
         * @method movePrevious
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
         * Forward based on the selected data view.
         * Has the same effect as clicking the 'next' button.
         * @method moveNext
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
         * Move to latest available data based on the selected data view.
         * Has the same effect as clicking the 'last' button.
         * @method moveLast
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
         * Download values.
         * @method doDownload
         * @param {String} ot Output type of the download.
         * <b>Node</b>: This is a template method and should be overwritten.
         */
        doDownload: Ext.emptyFn,

        // private
        onDestroy: function () {
            this.bindStore(null);
            Ext.ux.flot.Tbar.superclass.onDestroy.call(this);
        }
    });
    Ext.reg('xflottbar', Ext.ux.flot.Tbar);
}());
