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

/*global AppKit, Ext */

(function () {
    'use strict';
    Ext.ns('Ext.ux.ingraph.Urls');
    Ext.ux.ingraph.Urls = (function () {
        var base = AppKit.util.Config.getBaseUrl() + '/modules/ingraph/',
            baseProvider = base + 'provider/',
            baseComments = base + 'comments/',
            baseTemplates = base + 'templates/',
            baseViews = base + 'views/';
        return {
            provider: {
                hosts: baseProvider + 'hosts',
                services: baseProvider + 'services',
                plots: baseProvider + 'plots',
                template: baseProvider + 'template',
                values: baseProvider + 'values',
                view: baseProvider + 'view',
                views: baseProvider + 'views',
                intervals: baseProvider + 'intervals'
            },
            comments: {
                create: baseComments + 'create',
                update: baseComments + 'update',
                remove: baseComments + 'delete'
            },
            templates: {
                create: baseTemplates + 'create',
                update: baseTemplates + 'update'
            },
            views: {
                create: baseViews + 'create',
                update: baseViews + 'update'
            },
            available: false,
            overwrite: function (urls) {
                urls.available = true;
                return (Ext.ux.ingraph.Urls = urls);
            }
        };
    }());
}());
