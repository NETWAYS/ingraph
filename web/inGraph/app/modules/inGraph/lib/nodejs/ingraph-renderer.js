#!/usr/bin/env node

/**
 * inGraph renderer
 *
 * Uses NodeJS to create inGraph PNG files
 */
// https://gist.github.com/708172 -> changes to flot
// Load local JS files for DOM usage:

var fs = require('fs');
var src = '';
['jquery-1.5.min.js',
'jquery.flot.node-canvas.js',
'jquery.flot.text.js'].forEach(function(file) {
    src += fs.readFileSync(__dirname + '/' + file) + "\n";
});

var plugins = require(__dirname + '/ingraph-plugins.js');

require('jsdom').env({
    html: '<html><body><div id="place" /></body></html>',
    src: src,
    done: function (err, window)
    {
        if (err) { throw err; }
        ready(window);
    }
});

var win;
var buffer = [];

function initializeStdin()
{
    process.stdin.setEncoding('utf8');
    process.stdin.resume();

    process.stdin.on('data', function(chunk) {
        var last = buffer.length > 0 ? buffer[buffer.length - 1] : '';
        var parts = chunk.split(/\n/);
        var first = true;
        parts.forEach(function(line) {
            if (first) {
                first = false;
                if (buffer.length > 0) {
                    buffer[buffer.length - 1] += line;
                } else {
                    buffer.push(line);
                }
                first = false;
            } else {
                buffer.push(line);
            }
            if (buffer[buffer.length - 1] == 'THEVERYENDOFMYJSON') {
                buffer.pop();
                processJson(buffer.join("\n"));
                buffer = [];
            }
        });
    });
}

function processJson(data)
{
    var params = JSON.parse(data);
    // Apply tick formatter function, could be improved:
    params.options.yaxis.tickFormatter = plugins.simpleTickFormatter;

    var $  = window.$,
    $div   = $('#place'),
    $plot  = $.plot($div, params.flot.results, params.options),
    canvas = $plot.getCanvas();
    canvas.createPNGStream().on('data', function(chunk) {
        process.stdout.write(chunk);
    }).on('end', function() {
        $div.innerHTML = '';
        // Ugly:
        process.stdout.write("\nTHEVERYENDOFMYPNG\n");
    }).on('error', function(err) {
        process.stderr.write('Canvas error: ' + err);
        process.stdout.write("\nTHEVERYENDOFMYPNG\n");
    });
}

function ready(win)
{
    window = win;
    initializeStdin();
}

