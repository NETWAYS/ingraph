/**
 * Ext.ux.ingraph.portal.Placeholder
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

    Ext.ns('Ext.ux.ingraph.portal');

    /**
     * @class Ext.ux.ingraph.portal.Placeholder
     * @extends Ext.Container
     * @namespace Ext.ux.ingraph.portal
     * @author Eric Lippmann <eric.lippmann@netways.de>
     * @constructor
     * @param {Object} cfg
     * A config object.
     * @xtype xigportalplaceholder
     */
    Ext.ux.ingraph.portal.Placeholder = Ext.extend(Ext.Container, {

        /**
         * Get this component's state.
         * @method getState
         * @return {Object}
         */
        getState: function () {
            return {
                xtype: this.getXType()
            };
        }
    });
    Ext.reg('xigportalplaceholder', Ext.ux.ingraph.portal.Placeholder);
}());
