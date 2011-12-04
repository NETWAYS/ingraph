
// Tick formatter "simple":

exports.simpleTickFormatter = function(v, axis) {
	if(axis.rawTicks === undefined) {
		axis.rawTicks = axis.tickGenerator(axis);
	}
	if(v === axis.rawTicks[axis.rawTicks.length - 1]) {
		return axis.options.label !== undefined ?
		       (axis.options.unit !== undefined ?
		        axis.options.label + ' (' + axis.options.unit + ')' :
		        axis.options.label) :
		       v.toFixed(axis.tickDecimals);
	}
	return v.toFixed(axis.tickDecimals);
};

