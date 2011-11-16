(function($) {
    var options = {};
    
    var init = function(plot) {
        var series, i = 1;
        var sort = function(plot, s) {
            if(series === undefined) {
                series = plot.getData();
            }
            if(i > 1 && i === series.length) {
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
            }
            ++i;
        };
        plot.hooks.processRawData.push(sort);
    };
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'sort',
        version: '1.0'
    });
})(jQuery);