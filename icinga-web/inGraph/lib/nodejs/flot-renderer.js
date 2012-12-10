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

var $;

require('jsdom').env({
    html: '<html><body><div id="chart"></div></body></html>',
    scripts: ['../js/jquery/jquery-1.7.1.min.js',
              'jquery.flot.node-canvas.js',
              'jquery.flot.text.js'],
    done: function (exception, window) {
        if (exception) {
            throw exception;
        }
        $ = window.jQuery;
        streamPNG();
    }
});

function streamPNG() {
    var jsonIn = '',
        args;
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', function (data) {
        jsonIn += data;
    });
    process.stdin.on('end', function () {
        // Expect flcose on stdin
        args = JSON.parse(jsonIn);
        args.options = {};
        args.options.width = 640;
        args.options.height = 480;
        args.options.grid = args.options.grid || {};
        args.options.grid.canvasText = {
            show: true
        };
        args.options.grid.backgroundColor = '#fff';
        $.plot($('#chart'), args.data, args.options);
        process.stdout.write(
            $.plot($('#chart'), args.data, args.options).getCanvas().toBuffer());
    });
}
