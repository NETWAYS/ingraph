(function($) {
    var options = {};
    
    var init = function(plot) {
        var series, i = 1, seriesSorted = false;
        var sortByLabel = function(plot, s) {
            if(series === undefined) {
                series = plot.getData();
            }
            if(i > 1 && i === series.length) {
                series.sort(function(a, b) {
                    return a.label === b.label ? 0 :
                           (a.label < b.label ? -1 : 1);
                });
            }
            ++i;
        };
        var sortByMean = function(plot, s) {
            if(series === undefined) {
                series = plot.getData();
            }
            if(seriesSorted === false) {
                // Sort series by their mean from highest to lowest.
                // This is nice for filled lines since series will not paint
                // over each other.
                series.sort(function(a, b) {
                    return a.data.map(function(v) {
                        return parseFloat(v[1]);
                    }).mean() - b.data.map(function(v) {
                        return parseFloat(v[1]);
                    }).mean();
                });
                seriesSorted = true;
            }
        };
        plot.hooks.processRawData.push(sortByLabel);
        plot.hooks.drawSeries.push(sortByMean);
    };
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'sort',
        version: '1.0'
    });
})(jQuery);