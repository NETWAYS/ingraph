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

/*global Ext */

(function () {
    'use strict';
    Ext.override(Ext.ux.flot.Store, {
        /*
         * Add properties and functions required by inGraph.
         */

        commentsProperty: 'comments',
        getQuery: function () {
            if (this.lastOptions.query !== undefined) {
                return this.lastOptions.query;
            }
            return this.baseParams.query;
        },
        getComments: function () {
            return this.reader.jsonData[this.commentsProperty];
        },
        getHostsAndServices: function (hosts, services) {
            this.each(function (rec) {
                if (rec.get('enabled') !== true) {
                    return;
                }
                var host = rec.json.host,
                    service = rec.json.service;
                if (hosts.indexOf(host) === -1) {
                    hosts.push(host);
                }
                if (services.indexOf(service) === -1) {
                    services.push(service);
                }
            });
        }
    });
}());
