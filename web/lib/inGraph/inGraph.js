if ( ! String.prototype.format ) String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; ++i) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var iG = {};

iG.version = {
    major: 0,
    minor: 1
};