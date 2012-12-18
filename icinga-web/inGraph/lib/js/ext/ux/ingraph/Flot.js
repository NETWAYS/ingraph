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

/*global Ext, inGraph */

(function () {
    'use strict';
    var rebuildQuery = function () {
        // rebuild query based on template's series
        var series = Ext.pluck(this.template.getRange(), 'json'),
            query = Ext.encode(inGraph.format.query(series));
        this.store.setBaseParam('query', query);
        this.store.reload();
    };
    Ext.override(Ext.ux.flot.Flot, {
        /*
         * Rebuild query sent to the plot values provider on adding and removing
         * series. Reloads the store.
         */
        // private override
        onTemplateadd: rebuildQuery,
        // private override
        onTemplateremove: rebuildQuery
    });
}());
