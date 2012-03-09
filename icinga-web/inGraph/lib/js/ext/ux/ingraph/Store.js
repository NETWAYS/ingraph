/*
 * Add properties and functions required by inGraph.
 */

(function () {
    "use strict";

    Ext.override(Ext.ux.flot.Store, {
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
