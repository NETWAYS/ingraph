(function ($) {
	
    var options = {
        series: {
            lines: {
                spline: false,
                splineNumber: 600
            }
        }
    };
    
    function init(plot) {
        
        function spline(plot, series, data, datapoints) {
        	if(!series.lines.spline) {
        		return;
        	}

        	var num = series.lines.splineNumber;
            
            var xdata = new Array;
            var ydata = new Array;
            
            for(var i = 0; i < data.length; i++) {
	            xdata[i] = data[i][0];
	            ydata[i] = data[i][1];
            }
            
            var n = xdata.length;
            if(n !== ydata.length) {
            	return null;
            }
            
            var y2 = new Array();
            var delta = new Array();
            y2[0] = 0;
            y2[n - 1] = 0;
            delta[0] = 0;
            
            for(var i = 1; i < n - 1; ++i) {
            	var d = (xdata[i + 1] - xdata[i - 1]);
            	
            	if(d == 0) {
            		return null;
            	}
            	
            	var s = (xdata[i] - xdata[i - 1]) / d;
            	var p = s * y2[i - 1] + 2;
            	y2[i] = (s - 1) / p;
            	delta[i] = (ydata[i + 1] - ydata[i]) / (xdata[i + 1] - xdata[i]) - (ydata[i] - ydata[i - 1]) / (xdata[i] - xdata[i - 1]);
            	delta[i] = (6 * delta[i] / (xdata[i + 1] - xdata[i - 1]) - s * delta[i - 1]) / p;
            }
            
            for(var j = n - 2; j >= 0; --j) {
            	y2[j] = y2[j] * y2[j + 1] + delta[j];
            }
            
            var step = (xdata[n - 1] - xdata[0]) / (num - 1);
            var xnew = new Array;
            var ynew = new Array;
            var result = new Array;
            
            xnew[0] = xdata[0];
            ynew[0] = ydata[0];
            
            for(j = 1; j < num; ++j) {
            	xnew[j] = xnew[0] + j * step;
            	
            	var max = n - 1;
            	var min = 0;
            	
            	while(max - min > 1) {
            		var k = Math.round((max + min) / 2);
            		if(xdata[k] > xnew[j]) {
            			max = k;
            		} else {
            			min = k;
            		}
            	}
            	
            	var h = (xdata[max] - xdata[min]);
            	
            	if(h == 0) {
            		return null;
            	}
            	
            	var a = (xdata[max] - xnew[j]) / h;
            	var b = (xnew[j] - xdata[min]) / h;
            	
            	ynew[j] = a * ydata[min] + b * ydata[max] + ((a * a * a - a) * y2[min] + (b * b * b - b) * y2[max]) * (h * h) / 6;
            	result.push(new Array(series.xaxis.options.mode == 'time' ? Math.ceil(xnew[j]) : xnew[j], ynew[j]));
            }
            
            series.data = result;
            data = result;
        }
        
        plot.hooks.processRawData.push(spline);
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'spline',
        version: '0.1'
    });
    
})(jQuery);