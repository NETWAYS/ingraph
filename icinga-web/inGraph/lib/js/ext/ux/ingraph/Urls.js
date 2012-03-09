/**
 * Ext.ux.ingraph.Urls
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

    Ext.ns('Ext.ux.ingraph.Urls');

    /**
     * @class Ext.ux.ingraph.Urls
     * @extends Object
     * @singleton
     */
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
                views: baseProvider + 'views'
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
