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

/*global _, $, AppKit, Ext, forecast */

(function () {
    'use strict';
    Ext.ns('Ext.ux.flot');
    Ext.ux.flot.Flot = Ext.extend(Ext.BoxComponent, {
        /**
         * Milliseconds to delay plot refresh on store's update event.
         */
        refreshBuffer: 200,
        /**
         * Whether to mask the element while loading.
         */
        loadMask: false,
        /**
         * @cfg {Object} tips
         * Configuration object for both data tooltips and selection tooltips with
         * following parameters:<ul>
         * <li><b>enable</b> : Boolean<div class="sub-desc"><tt>false</tt> to
         * disable both datapoint and selection tooltips. Defaults to
         * <tt>true</tt>.</div></li>
         * <li><b>event</b> : String<div class="sub-desc">Show datapoint tooltip
         * if one of <tt>plothover</tt> or <tt>plotlick</tt> events fire. If
         * tips enabled, selecting the plot always shows the selection tooltip.
         * <b>Note</b> that flot has to be enabled with <tt>clickable</tt> or
         * <tt>hoverable</tt> in order to fire the corresponding events.</div></li>
         * <li><b>includeRadius</b> : Number<div class="sub-desc">
         * Extend the datapoint tooltip with nearby datapoints according to radius.
         * Defaults to <tt>10</tt>.</div></li>
         * <li><b>datapointTemplate</b> : Ext.Template<div class="sub-desc">
         * Template for the selection tooltip.</div></li>
         * <li><b>datapointTemplate</b> : Ext.Template<div class="sub-desc">
         * Template for the datapoint tooltip.</div></li></ul>
         */
        cls: 'xflot',
        /**
         * Force style for flot's legend, grid, axes and series defaults.
         * Each key-value pair <tt>overrides</tt> its corresponding template member.
         * See <a href="http://flot.googlecode.com/svn/trunk/API.txt">Flot Reference</a>
         * for possible parameters.
         */
        flotStyle: {},
        /**
         * View full x-axis range even on no data.
         */
        absolute: true,
        // private
        zooms: [],
        autoRefreshInterval: 300,
        autoYAxes: false,
        /**
         * @cfg {Ext.ux.flot.Store} store The {@link Ext.ux.flot.Store} the component
         * should use as its data source <b>(required)</b>.
         */
        /**
         * @cfg {Ext.ux.flot.Template} template The {@link Ext.ux.flot.Template}
         * the component should use as its template <b>(required)</b>.
         */
        /**
         * @property {jquery.flot plot object} $plot
         * Reference to the jquery.flot plot object.
         */
        /**
         * @property {Object} $flotStyle
         * Merged style.
         */
        // private override
        initComponent: function () {
            this.injectDefaults();
            Ext.ux.flot.Flot.superclass.initComponent.call(this);
            this.addEvents(
                /**
                 * @event beforeplot
                 * Fires before the chart is plotted. A handler may return
                 * <tt>false</tt> to cancel plotting.
                 * @param {Ext.ux.flot.Flot} this
                 */
                'beforeplot',
                /**
                 * @event plot
                 * Fires after the chart is plotted.
                 * @param {Ext.ux.flot.Flot} this
                 */
                'plot',
                /**
                 * @event plotclick
                 * Fires when clicked anywhere in plot area. <b>Note</b> that
                 * flot's grid <tt>clickable</tt> parameter has to be set to <tt>true</tt>
                 * (either via {@link #template} or {@link #flotStyle}) to enable
                 * firing of this event.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object|null} item
                 * @param {Object} pos
                 */
                'plotclick',
                /**
                 * @event plothover
                 * Fires when the mouse is hovering over the plot area. <b>Note</b> that
                 * flot's grid <tt>hoverable</tt> parameter has to be set to <tt>true</tt>
                 * (either via {@link #template} or {@link #flotStyle}) to enable
                 * firing of this event.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object|null} item
                 * @param {Object} pos
                 */
                'plothover',
                /**
                 * @event plotselecting
                 * Fires while selecting the plot area. <b>Note</b> that this event
                 * only fires if the selection plugin of flot is loaded.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object} ranges
                 * @param {Object} pos
                 */
                'plotselecting',
                /**
                 * @event plotselected
                 * Fires after selecting the plot area. <b>Note</b> that this event
                 * only fires if the selection plugin of flot is loaded.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object} ranges
                 */
                'plotselected',
                /**
                 * @event beforezoomin
                 * Fires after the {@link #plotselected} event and right before
                 * the involved zoom in operation. <b>Note</b> that this event
                 * only fires if the selection plugin of flot is loaded. A handler
                 * may return <tt>false</tt> to cancel zoom in.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object} ranges
                 */
                'beforezoomin',
                /**
                 * @event zoomin
                 * Fires after zoom in.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object} ranges
                 */
                'zoomin',
                /**
                 * @event beforezoomout
                 * Fires after the {@link #contextmenu} event and right before
                 * the involved zoom out operation. A handler may return
                 * <tt>false</tt> to cancel zoom out.
                 * @param {Ext.ux.flot.Flot} this
                 */
                'beforezoomout',
                /**
                 * @event zoomout
                 * Fires after zoom out.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Object} ranges
                 */
                'zoomout',
                /**
                 * @event contextmenu
                 * Fires when a rightclick is detected within the plot area.
                 * @param {Ext.ux.flot.Flot} this
                 * @param {Ext.EventObject} e
                 */
                'contextmenu'
            );
            this.bindStore(this.store, true);
            this.bindTemplate(this.template, true);
        },
        // private
        injectDefaults: function () {
            this.tips = Ext.applyIf(
                // In case this component got not explecitly configured with a
                // tips property it's undefined else don't overwrite defined keys
                this.tips || {},
                {
                    enable: true,
                    event: 'plothover',
                    includeRadius: 10,
                    selectionTemplate: new Ext.XTemplate(
                        '<div class = "xflot-tooltip">',
                        '<h2>' + _('Selection Information') + '</h2>',
                        '<tpl for=".">',
                        '<div style="padding-top: 5px">',
                        '<h3><u>{axis}</u></h3>',
                        '<div style="padding-left: 5px"><b>' + _('Start') + ' : </b> <i>{start}</i></div>',
                        '<div style="padding-left: 5px"><b>' + _('End') + ' : </b> <i>{end}</i></div>',
                        '</div>',
                        '</tpl>',
                        '</div>',
                        {
                            compiled: true,
                            disableFormats: true
                        }
                    ),
                    datapointTemplate: new Ext.XTemplate(
                        '<div class = "xflot-tooltip">',
                        '<h3>{label}</h3>',
                        '<div>{x} : {y}</div>',
                        '</div>',
                        {
                            compiled: true,
                            disableFormats: true
                        }
                    )
                }
            );
        },
        // private override
        afterRender: function () {
            Ext.ux.flot.Flot.superclass.afterRender.call(this);
            // Bind events once the element becomes ready
            this.bindEvents();
        },
        // private
        bindEvents: function () {
            if (this.loadMask === true) {
                this.loadMask = new Ext.LoadMask(this.el, Ext.apply({
                    store: this.store,
                    removeMask: true
                }, this.loadMask));
            }
            var self = this;
            // Forward flot's jquery events
            $('#' + this.id).bind('plothover', function ($event, pos, item) {
                self.fireEvent('plothover', self, item, pos);
                self.onPlothover(item, pos);
            });
            // Plotselecting only fires if the selection plugin of flot is loaded
            $('#' + this.id).bind('plotselecting', function ($event, ranges, pos) {
                self.fireEvent('plotselecting', self, ranges, pos);
                self.onPlotselecting(ranges, pos);
            });
            // Plotselected only fires if the selection plugin of flot is loaded
            $('#' + this.id).bind('plotselected', function ($event, ranges) {
                self.fireEvent('plotselected', self, ranges);
                self.onPlotselected(ranges);
            });
            $('#' + this.id).bind('plotclick', function ($event, pos, item) {
                self.fireEvent('plotclick', self, item, pos);
                self.onPlotclick(item, pos);
            });
            if (this.tips.enable === true) {
                this.showDatapointTipTask = new Ext.util.DelayedTask(
                    this.showDatapointTip, this);
                // Show datapoint tooltip on either plotclick or plothover
                this.on(this.tips.event, function (me, item, pos) {
                    if (item) {
                        me.showDatapointTipTask.delay(
                            100, null, null, [item, pos]);
                    } else {
                        me.showDatapointTipTask.cancel();
                        if (me.dpTip) {
                            me.dpTip.hide();
                        }
                    }
                });
                // Show selection tooltip on plotselecting
                this.on('plotselecting', function (me, ranges, pos) {
                    if (ranges) {
                        me.showSelectionTip(ranges, pos);
                    } else if (me.selTip) {
                        me.selTip.hide();
                    }
                });
            }
            this.el.on({
                scope: this,
                contextmenu: function (e) {
                    this.fireEvent('contextmenu', this, e);
                    this.onContextmenu(e);
                }
            });
        },
        // private
        onPlothover: Ext.emptyFn,
        // private
        onPlotselecting: Ext.emptyFn,
        // private
        onPlotselected: function (ranges) {
            this.clip(ranges);
            if (this.fireEvent('beforezoomin', this, ranges) !== false) {
                if (ranges.xaxis) {
                    this.zoomin(ranges);
                }
            }
            // Hide selection tooltip if any
            if (this.selTip) {
                this.selTip.hide();
            }
        },
        // private
        onPlotclick: Ext.emptyFn,
        // private
        onContextmenu: function (e) {
            if (this.fireEvent('beforezoomout', this) !== false) {
                // Prevent browser's context menu
                e.stopEvent();
                this.zoomout();
            }
        },
        /**
         * Changes the data store bound to this component and refreshes it.
         * @param {Store} store The store to bind to this component.
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
                    this.store.on({
                        scope: this,
                        datachanged: this.onDatachanged,
                        update: this.onUpdate,
                        beforeload: this.onBeforeload,
                        add: this.onAdd,
                        remove: this.onRemove
                    });
                }
                if (!store) {
                    this.store = null;
                }
            }
            if (store) {
                store.on({
                    scope: this,
                    datachanged: this.onDatachanged,
                    update: this.onUpdate,
                    beforeload: this.onBeforeload,
                    add: this.onAdd,
                    remove: this.onRemove
                });
                this.store = store;
                this.store.startRefresh(this.autoRefreshInterval);
            }
        },
        // private
        onDatachanged: function () {
            this.plot();
        },
        // private
        onUpdate: function () {
            this.delayPlot();
        },
        // private
        onBeforeload: function () {
            var ownerCt = this;
            do {
                if (ownerCt.hidden || ownerCt.collapsed || !ownerCt.rendered) {
                    // Cancel load if not visible
                    return false;
                }
                ownerCt = ownerCt.ownerCt;
            } while (ownerCt);
        },
        // private
        onAdd: Ext.emptyFn,
        // private
        onRemove: Ext.emptyFn,
        /**
         * Changes the template store bound to this component and refreshes it.
         * @param {Store} store The store to bind to this component.
         * @param {Boolean} initial (Optional) <tt>true</tt> to not remove listeners.
         */
        bindTemplate: function (template, initial) {
            if (template) {
                template = Ext.StoreMgr.lookup(template);
            }
            if (!initial && this.template) {
                if (template !== this.template && this.template.autoDestroy) {
                    this.template.destroy();
                } else {
                    this.template.un({
                        scope: this,
                        datachanged: this.onTemplatechanged,
                        update: this.onTemplateupdate,
                        add: this.onTemplateadd,
                        remove: this.onTemplateremove,
                        axisadd: this.onTemplateupdate,
                        axisupdate: this.onTemplateupdate,
                        axisremove: this.onTemplateupdate
                    });
                }
                if (!template) {
                    this.template = null;
                }
            }
            if (template) {
                template.on({
                    scope: this,
                    datachanged: this.onTemplatechanged,
                    update: this.onTemplateupdate,
                    add: this.onTemplateadd,
                    remove: this.onTemplateremove,
                    axisadd: this.onTemplateupdate,
                    axisupdate: this.onTemplateupdate,
                    axisremove: this.onTemplateupdate
                });
                this.on({
                    scope: this,
                    beforeplot: this.applyTemplate
                });
                this.template = template;
            }
        },
        /**
         * Persists template information into this component's data store.
         */
        applyTemplate: function () {
            this.template.suspendEvents();
            this.store.suspendEvents();
            this.template.each(function (seriesTemplate) {
                var series = this.store.getById(seriesTemplate.id);
                if (!series) {
                    // TODO(el): Notify?
                    // Skip
                    return true;
                }
                Ext.iterate(seriesTemplate.fields.map, function (key, field) {
                    var seriesValue = series.get(field.name),
                        templateValue = seriesTemplate.get(field.name);
                    if (seriesTemplate.isModified(field.name) === false &&
                        (seriesValue === templateValue ||
                            templateValue === field.defaultValue)
                    ) {
                        // Continue
                        return true;
                    }
                    series.set(field.name, templateValue);
                });
            }, this);
            var hosts = [];
            this.store.each(function (series) {
                if (-1 === hosts.indexOf(series.json.host)) {
                    hosts.push(series.json.host);
                }
                var convert = series.get('convert'),
                    convertFn;
                if (!convert) {
                    // Continue
                    return true;
                }
                try {
                    convertFn = Ext.decode(convert);
                } catch (e) {
                    // TODO(el): Notify
                    AppKit.log(e);
                    // Continue
                    return true;
                }
                if (!Ext.isFunction(convertFn)) {
                    // TODO(el): Notify
                    // v
                    return true;
                }
                var scope = {},
                    snapshot = Ext.pluck(
                        this.store.getRange(),
                        'data'
                    );
                Ext.each(series.get('data'), function (xy) {
                    var y;
                    try {
                        y = convertFn.call(
                            scope,
                            xy[1],
                            xy[0],
                            snapshot
                        );
                    } catch (e) {
                        // TODO(el): Notify
                        AppKit.log(e);
                        // Break
                        return false;
                    }
                    if (y !== xy[1] &&
                        (Ext.isNumber(y) || y === null)
                    ) {
                        xy[1] = y;
                    }
                });
            }, this);
            if (this.autoYAxes === true && false) {
                // All yaxes share the same baseline
                var baseline = null,
                    unitToAxisMap = {},
                    skyline = null;
                this.store.each(function (series) {
                    if (series.get('enabled') !== true) {
                        // Continue
                        return;
                    }
                    // Collect yvalues with null eliminated
                    var yvalues = [],
                        y,
                        seriesmin;
                    Ext.each(series.get('data'), function (xy) {
                        y = xy[1];
                        if (y !== null) {
                            yvalues.push(y);
                        }
                    });
                    // Overwrite baseline if appropriate
                    seriesmin = yvalues.length > 0 ? Ext.min(yvalues) : null;
                    if (seriesmin !== null &&
                            (baseline === null || seriesmin < baseline)) {
                        baseline = seriesmin;
                    }
                    var yaxisIndex = series.get('yaxis'),
                        yaxis;
                    if (Ext.isNumber(yaxisIndex)) {
                        // Template defined valid axis index for this series
                        // Find the axis
                        yaxis = this.template.yaxes.getById(yaxisIndex);
                        if (!yaxis) {
                            // Skip, we do not fix invalid configurations
                            return;
                        }
                    }
                    var seriesUnit = series.get('unit'),
                        seriesLabel = series.get('label'),
                        yaxisLabel;
                    if (yaxis) {
                        var yaxisUnit = yaxis.get('unit');
                        yaxisLabel = yaxis.get('label');
                        if (yaxisUnit === null) {
                            yaxis.set('unit', seriesUnit);
                            yaxisUnit = seriesUnit;
                        }
                        if (unitToAxisMap[yaxisUnit] === undefined) {
                            unitToAxisMap[yaxisUnit] = yaxis.id;
                        }
                        if (yaxisLabel === null) {
                            yaxis.set('label', [seriesLabel]);
                        } else if (Ext.isArray(yaxisLabel) &&
                                yaxisLabel.indexOf(seriesLabel) === -1) {
                            yaxisLabel.push(seriesLabel);
                        }
                    } else {
                        yaxis = unitToAxisMap[seriesUnit];
                        if (yaxis === undefined) {
                            var recordData = {
                                label: [],
                                unit: seriesUnit,
                                index: this.template.yaxes.data.length + 1
                            };
                            // Use default values of fields
                            Ext.iterate(this.template.yaxes.fields.map, function (key, field) {
                                if (recordData[field.name] !== undefined) {
                                    // Skip already defined fields
                                    return;
                                }
                                recordData[field.name] = field.defaultValue;
                            });
                            yaxis = new this.template.yaxes.recordType(recordData, recordData.index);
                            this.template.yaxes.add(yaxis);
                            unitToAxisMap[seriesUnit] = yaxis.get('index');
                        } else {
                            yaxis = this.template.yaxes.getById(yaxis);
                        }
                        yaxisLabel = yaxis.get('label');
                        if (Ext.isArray(yaxisLabel) &&
                                yaxisLabel.indexOf(seriesLabel) === -1) {
                            yaxisLabel.push(seriesLabel);
                        }
                        series.set('yaxis', yaxis.id);
                    }

                    var seriesTemplate = this.template.getById(series.id);
                    if (seriesTemplate) {
                        // Series template may not exist, i.e. removed via dialog
                        seriesTemplate.set('yaxis', series.get('yaxis'));
                        seriesTemplate.set('label', series.get('label'));
                        seriesTemplate.set('unit', series.get('unit'));
                    }
                }, this);
                this.template.yaxes.each(function (yaxis) {
                    if (yaxis.get('unit') === 'percent') {
                        if (yaxis.isModified('min') === false &&
                                yaxis.get('min') === null) {
                            yaxis.set('min', 0);
                        }
//                        if (yaxis.isModified('max') === false &&
//                                yaxis.get('max') === null) {
//                            yaxis.set('max', 100);
//                        }
                    }
                    /*!
                     * TODO(el): Set baseline on every load if not user-defined.
                     * Store needs sort of locking prior to that.
                     */
//                    if (yaxis.isModified('min') === false &&
//                            yaxis.get('min')  === null) {
//                        yaxis.set('min', baseline);
//                    }
                });
            }
            if (hosts.length > 1) {
                this.store.each(function (series) {
                    series.set(
                        'label',
                        series.json.host + ': ' + series.get('label'));
                });
            }
            // Recursive merge objects
            this.$flotStyle = $.extend(true, {}, this.template.getStyle(),
                                       this.flotStyle);
            this.template.resumeEvents();
            this.store.resumeEvents();
        },
        // private
        delayApplyTemplate: function () {
            if (!this.templateRefreshTask) {
                this.templateRefreshTask = new Ext.util.DelayedTask(
                    this.plot,
                    this
                );
            }
            this.templateRefreshTask.delay(this.refreshBuffer);
        },
        // private
        onTemplatechanged: function () {
            this.plot();
        },
        // private
        onTemplateupdate: function () {
            this.delayApplyTemplate();
        },
        // private
        onTemplateadd: Ext.emptyFn,
        // private
        onTemplateremove: Ext.emptyFn,
        // private
        showDatapointTip: function (item, pos) {
            if (!this.dpTip) {
                // Limit to one tooltip instance
                this.dpTip = new Ext.Tip({
                    renderTo: Ext.getBody(),
                    constrainPosition: true
                });
            }
            var x = item.datapoint[0],
                series = item.series.data,
                seriesXY = series[item.dataIndex],
                y;
            // TODO(el): Include nearby series
            // Since flot options like steps, stack and fillBetween modify/insert
            // datapoints, try to use the vanilla series value
            if (seriesXY === undefined || seriesXY[0] !== x) {
                // Index may mismatch if there are added datapoints
                var xvalues = [],
                    seriesX;
                Ext.each(series, function (xy) {
                    xvalues.push(xy[0]);
                });
                // Search datapoint's x value in the series array
                seriesX = xvalues.bsearch(x);
                if (seriesX === -1) {
                    // If the x value is bogus use the y value of the datapoint
                    y = item.datapoint[1];
                } else {
                    y = series[seriesX][1];
                }
            } else {
                // Vanilla value
                y = seriesXY[1];
            }
            if (y !== null) {
                var xaxis = item.series.xaxis,
                    yaxis = item.series.yaxis,
                    tipContent = this.tips.datapointTemplate.apply(Ext.apply(
                        {
                            x: xaxis.tickFormatter(x, xaxis),
                            y: yaxis.tickFormatter(y, yaxis)
                        },
                        item.series
                    ));
                this.dpTip.update(tipContent);
                // Offset tooltip
                this.dpTip.showAt([pos.pageX + 10, pos.pageY + 10]);
                // TODO(el): Constrain
            }
        },
        // private
        showSelectionTip: function (ranges, pos) {
            if (!this.selTip) {
                // Limit to one tooltip instance
                this.selTip = new Ext.Tip({
                    renderTo: Ext.getBody()
                });
            }
            var axes = this.$plot.getAxes(),
                templateData = [];
            Ext.iterate(axes, function (axisName, axis) {
                // TODO(el): ?
                if (!Ext.isObject(ranges[axisName])) {
                    return true;
                }
                var start = ranges[axisName].from,
                    end = ranges[axisName].to;
                if (!Ext.isFunction(axis.tickFormatter)) {
                    // The axis lacks the tick formatter if it's hidden
                    return true;
                }
                templateData.push({
                    start: axis.tickFormatter(start, axis),
                    end: axis.tickFormatter(end, axis),
                    axis: axisName
                });
            });
            var tipContent = this.tips.selectionTemplate.apply(templateData);
            this.selTip.update(tipContent);
            // Offset tooltip
            this.selTip.showAt([pos.pageX + 10, pos.pageY + 10]);
            // TODO(el): Constrain
        },
        /**
         * Loads this component's data store from ranges.
         * @param {Object} ranges
         */
        zoomin: function (ranges) {
            this.zooms.push(ranges);
            var params = {
                interval: null
            };
            Ext.iterate(ranges, function (axisName, range) {
                // Axis identifiers are direction + index, f.e. x, x2, y, y2
                var axisIdentifier = axisName.replace('axis', '');
                params['start' + axisIdentifier] = range.from;
                params['end' + axisIdentifier] = range.to;
            });
            if (this.$flotStyle.xaxis.mode === 'time') {
                params.startx = Math.ceil(params.startx / 1000);
                params.endx = Math.ceil(params.endx / 1000);
            }
            this.store.load({
                params: params
            });
            this.fireEvent('zoomin', this, ranges);
        },
        /**
         * Loads this component's data store from ranges passed to
         * <tt>{@link #zoomin}</tt>.
         */
        zoomout: function () {
            if (this.zooms.pop()) {
                var ranges = this.zooms.last();
                if (ranges) {
                    var params = {};
                    Ext.iterate(ranges, function (axisName, range) {
                        // Axis identifiers are direction + index, f.e. x, x2, y, y2
                        var axisIdentifier = axisName.replace('axis', '');
                        params['start' + axisIdentifier] = range.from;
                        params['end' + axisIdentifier] = range.to;
                    });
                    if (this.$flotStyle.xaxis.mode === 'time') {
                        params.startx = Math.ceil(params.startx / 1000);
                        params.endx = Math.ceil(params.endx / 1000);
                    }
                    this.store.load({
                        params: params
                    });
                } else {
                    this.store.load();
                }
                this.fireEvent('zoomout', this, ranges);
            }
        },
       /**
        * Plots a chart using Flot, a Javascript plotting library for jQuery.
        * Listen to the {@link #beforeplot} event and return <tt>false</tt>
        * to cancel plotting. Fires the {@link #plot} event after completion.
        * @param {Number} id Id of the container to plot to. Defaults to this
        * component's element if undefined or null.
        * @param {Array} series Collection of series objects. Defaults to this
        * component's data source if undefined.
        * @return {Ext.ux.flot.Flot} this
        */
        plot: function (id, series) {
            if (this.fireEvent('beforeplot', this) !== false) {
                if (id === undefined || id === null) {
                    id = this.id;
                }
                if (series === undefined) {
                    this.store.suspendEvents();
                    this.store.filter('enabled', true);
                    series = this.store.toJson();
                    this.store.clearFilter();
                    this.store.resumeEvents();
                }
                if (this.absolute) {
                    // Force full view of x-axis range even if there's no data
                    var min = this.store.getStartX(),
                        max = this.store.getEndX();
                    if (this.$flotStyle.xaxis.mode === 'time') {
                        min *= 1000;
                        max *= 1000;
                    }
                    Ext.apply(this.$flotStyle.xaxis, {
                        min: min,
                        max: max
                    });
                }
                if (this.periodAverage) {
                    this.store.query('type', 'avg').each(function (avgPlot) {
                        if (!avgPlot.data.enabled) {
                            // continue
                            return;
                        }
                        var periodAvg = 0,
                            valueChanged = false,
                            i = 0,
                            c = 0;
                        Ext.each(avgPlot.data.data, function (xy, i) {
                            if (!valueChanged && i > 0 &&
                                xy[1] !== avgPlot.data.data[i - 1][1]
                            ) {
                                valueChanged = false;
                            }
                            if (null !== xy[1]) {
                                periodAvg += xy[1];
                                ++c;
                            }
                        });
                        periodAvg /= c;
                        var avgSeries = {
                            label: _('Period average of') + ' ' + avgPlot.data.label,
                            data: [],
                            lines: {
                                fill: false,
                                show: true
                            },
                            stack: false
                        };
                        for (; i < avgPlot.data.data.length; ++i) {
                            avgSeries.data.push([avgPlot.data.data[i][0],
                                                 periodAvg]);
                        }
                        series.push(avgSeries);
                    });
                }
                if (this.prediction && 0 === this.zooms.length) {
                    var observations = this.store.getById(this.prediction.plot),
                        Yt = [],
                        Fth = [],
                        i = 0,
                        Fthy,
                        Xlast = observations.data.data[observations.data.data.length-1][0],
                        c = Math.ceil((this.prediction.end - Xlast) / (observations.json.granularity*1000)),
                        p;
                    Ext.each(observations.data.data, function (xy, i) {
                        if (null !== xy[1]) {
                            Yt.push(xy[1]);
                        }
                    });
                    p = Math.ceil(this.prediction.seasons !== null ?
                        (this.prediction.seasons < Yt.length/2 ?
                            this.prediction.seasons : Yt.length/4) :
                            Yt.length/2);
                    Fthy = forecast.HoltWinters(
                        Yt, p, c, this.prediction.smoothingConstants);
                    for (; i < Fthy.length; ++i) {
                        Fth.push([Xlast + observations.json.granularity * 1000 * i,
                                  Fthy[i]]);
                    }
                    series.push({
                        label: this.prediction.label,
                        color: this.prediction.color,
                        data: Fth,
                        lines: {
                            fill: false,
                            show: true
                        },
                        stack: false
                    });
                    if (this.absolute) {
                        this.$flotStyle.xaxis.max = null;
                    }
                }
                this.$plot = $.plot($('#' + id), series, this.$flotStyle);
                if (this.loadMask) {
                    // TODO(el): Obsolete?
                    this.el.setStyle('position', 'relative');
                }
                this.fireEvent('plot', this);
            }
            return this;
        },
        // private
        delayPlot: function () {
            if (!this.refreshTask) {
                this.refreshTask = new Ext.util.DelayedTask(this.plot, this);
            }
            this.refreshTask.delay(this.refreshBuffer);
        },
        /**
         * Extracts flot's data from ranges.
         * @param {Object} ranges
         * @returns {Array} Flot series records.
         */
        clip: function (ranges) {
            var clipped = [];
            if (this.$plot) {
                Ext.each(this.$plot.getData(), function (series) {
                    var xrange = series.xaxis.n > 1 ?
                                 ranges[String.format('x{0}axis', series.xaxis.n)] :
                                 ranges.xaxis,
                        yrange = series.yaxis.n > 1 ?
                                 ranges[String.format('y{0}axis', series.yaxis.n)] :
                                 ranges.yaxis,
                        data = $.grep(series.data, function (xy) {
                            if (xy[0] >= xrange.from &&
                                    xy[0] <= xrange.to &&
                                    xy[1] >= yrange.from &&
                                    xy[1] <= yrange.to) {
                                return true;
                            }
                            return false;
                        });
                    if (data.length) {
                        clipped.push(Ext.apply(
                            {},
                            series,
                            {
                                data: data
                            }
                        ));
                    }
                });
            }
            return clipped;
        },
        // private override
        onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
            if (this.$plot) {
                this.$plot.resize();
                this.$plot.setupGrid();
                this.$plot.draw();
            }
        },
        // private override
        onDestroy: function () {
            if (this.refreshTask && this.refreshTask.cancel) {
                this.refreshTask.cancel();
            }
            if (this.templateRefreshTask && this.templateRefreshTask.cancel) {
                this.templateRefreshTask.cancel();
            }
            this.bindStore(null);
            this.bindTemplate(null);
            if (this.dpTip) {
                this.dpTip.destroy();
                this.dpTip = null;
            }
            if (this.showDatapointTipTask) {
                this.showDatapointTipTask.cancel();
                this.showDatapointTipTask = null;
            }
            if (this.selTip) {
                this.selTip.destroy();
                this.selTip = null;
            }
            Ext.ux.flot.Flot.superclass.onDestroy.call(this);
        }
    });
    Ext.reg('xflot', Ext.ux.flot.Flot);
}());
