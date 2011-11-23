/**
 * @class Ext.ux.Stack
 * @extends Ext.util.Observable
 */
Ext.ux.Stack = Ext.extend(Ext.util.Observable, {
    constructor: function(cfg){
    	Ext.applyIf(cfg, {
    		stack: new Array()
    	});
    	Ext.apply(this, cfg);
        this.addEvents(
            'push',
            'pop'
        );
        Ext.ux.Stack.superclass.constructor.call(this, cfg)
    },
    
    empty: function() {
    	return this.stack.length ? true : false;
    },
    
    push: function(item) {
    	this.stack.push(item);
    	this.fireEvent('push', this, item);
    },
    
    pop: function() {
    	item = this.stack.pop();
    	this.fireEvent('pop', this, item);
    	return item;
    }
});