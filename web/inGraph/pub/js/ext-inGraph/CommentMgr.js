Ext.ns('Ext.iG');
/**
 * @class Ext.iG.CommentMgr
 * @extends Object
 * @singleton
 */
Ext.iG.CommentMgr = function() {
    var comments = [];
    return {
        register: function(id, el) {
            comments.push([id, el]);
        },
        
        unregister: function(id) {
            for(var i = 0, c; (c = comments[i]); ++i) {
                if(id === c[0]) {
                    Ext.destroy(c[1]);
                }
            }
        }
    };
}();