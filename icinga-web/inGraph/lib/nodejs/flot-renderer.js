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

var $,
    inGraph;

require('jsdom').env({
    html: '<html><body><div id="chart"></div></body></html>',
    scripts: ['../js/jquery/jquery-1.8.3.min.js',
              '../js/flot/jquery.flot.js',
              '../js/flot/jquery.flot.time.js',
              '../js/flot/jquery.flot.selection.js',
              '../js/flot/jquery.flot.stack.js',
              '../js/flot/jquery.flot.fillbetween.js',
              '../js/flot/jquery.flot.canvaslegend.js',
              '../js/flot-axislabels/jquery.flot.axislabels.js',
              '../js/Array.js',
              '../js/inGraph.js'],
    done: function (exception, window) {
        if (exception) {
            throw exception;
        }
        $ = window.jQuery;
        inGraph = window.inGraph;
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
        args.options.grid = args.options.grid || {};
        $.extend(args.options.grid, {
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0)',
            clickable: false,
            hoverable: false,
            backgroundColor: null,
            color: '#000000'
        });
        args.options.xaxis = args.options.xaxis || {};
        $.extend(args.options.xaxis, {
            labelWidth: 50,
            labelHeight: 20,
            tickFormatter: inGraph.flot.xTickFormatter,
            axisLabelUseCanvas: true
        });
        args.options.yaxis = args.options.yaxis || {};
        $.extend(args.options.yaxis, {
            labelWidth: 50,
            labelHeight: 20,
            tickFormatter: inGraph.flot.yTickFormatter,
            axisLabelUseCanvas: true
        });
        args.options.legend = args.options.legend || {};
        $.extend(args.options.legend, {
            backgroundOpacity: 0.1,
            container: null,
            position: 'nw'
        });
        process.stdout.write(
            $.plot(
                $('#chart').width(args.options.width)
                    .height(args.options.height),
                args.data,
                args.options
            ).getCanvas().toBuffer()
        );
    });
}
