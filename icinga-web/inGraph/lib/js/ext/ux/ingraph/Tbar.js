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
    function download (url, args) {
        // Submits a form within a hidden iframe
        var body = Ext.getBody(),
            frame = body.createChild({
                tag: 'iframe',
                cls: 'x-hidden'
            }),
            form = body.createChild({
                tag: 'form',
                cls: 'x-hidden',
                action: url,
                method: 'POST',
                children: (function () {
                    var inputFields = [];
                    Ext.iterate(args, function (name, value) {
                        inputFields.push({
                            type: 'text',
                            tag: 'input',
                            cls: 'x-hidden',
                            name: name,
                            value: value
                        });
                    });
                    return inputFields;
                }())
            });
        frame.appendChild(form);
        form.dom.submit();
        Ext.destroy(form, frame);
    }
    Ext.override(Ext.ux.flot.Tbar, {
        /*
         * Plug export functionality
         */
        doDownload: function (ot) {
            if ('png' === ot.toLowerCase()) {
                // TODO(el): download png
            } else {
                download(
                    this.store.url + '.' + ot,
                    {
                        start: this.store.getStartX(),
                        end: this.store.getEndX(),
                        query: Ext.util.Format.htmlEncode(this.store.getQuery())
                    }
                );
            }
        }
    });
}());
