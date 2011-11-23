Ext.ux.ComboController = Ext.extend(Object, {
    constructor: function(cfg) {
        Ext.apply(this, cfg);
    },
    
    init: function(combo) {
        if(!Ext.isArray(this.control)) {
            this.control = new Array(this.control);
        }
        
        combo.on({
            select: function() {
                Ext.each(this.control, function(cfg) {
                    var cmp = cfg.scope[cfg.cmp];
                    cmp.enable();
                    cmp.clearValue();
                }, this); 
            },
            change: function(self, value) {
                Ext.each(this.control, function(cfg) {
                    var cmp = cfg.scope[cfg.cmp];
                    cmp.clearValue();
                    if(value) {
                        cmp.enable();
                    } else {
                        cmp.disable();
                    }
                }, this);
            },
            scope : this
        });
    }
});
