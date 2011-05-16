(function ($) {
	
    function init(plot) {   	
    	var restore = {};
    	
    	function highlightSeries(series) {
    		var draw = false;
    		
    		$.each(series, function(i, s) {
    			if(typeof s.index === 'undefined') {
    				s.index = i;
    			}
    			
    			if(typeof restore[s.index] === 'undefined') {
	    			restore[s.index] = s.lines.lineWidth;
	    			s.lines.lineWidth += 2;
	    			draw = true;
    			}
    		});
    		
    		if(draw) {
    			plot.draw();
    		}
    	}
    	
    	function unHighlightSeries(series) {
    		var draw = false;
    		
    		$.each(series, function(i, s) {
    			if(typeof s.index === 'undefined') {
    				s.index = i;
    			}
    			
    			if(typeof restore[s.index] !== 'undefined') {
    				s.lines.lineWidth = restore[s.index];
    				delete restore[s.index];
    				draw = true;
    			}
    		});
    		
    		if(draw) {
    			plot.draw();
    		}
    	}
    	
        plot.hooks.bindEvents.push(function(plot, eventHolder) {
        	if(!plot.getOptions().series.lines.highlight) return;
        	
        	plot.getPlaceholder().bind('plothover', function (evt, pos, item) {
        		if(item) {
        			unHighlightSeries(plot.getData());
        			highlightSeries(new Array($.extend(item.series, {index : item.seriesIndex})));
        		} else {
        			unHighlightSeries(plot.getData());
        		}
        	});

        });
        
        plot.hooks.shutdown.push(function (plot, eventHolder) {
        	if(!plot.getOptions().series.lines.highlight) return;
        	
        	plot.getPlaceholder().unbind('plothover');
        });
    }
    
    var options = {
        series : {
        	lines : {
        		highlight : true
        	}
        }
    };

    $.plot.plugins.push({
        init : init,
        options : options,
        name : 'highlight',
        version : '0.1'
    });
    
})(jQuery);