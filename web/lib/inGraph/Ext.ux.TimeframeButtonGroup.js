Ext.ux.TimeframeButtonGroup = Ext.extend(Ext.ButtonGroup, {
	
	frames			: new Array(),
    
    constructor		: function(cfg) {
    	cfg			= cfg || {};
    	
    	this.active	= cfg.active || null;
    	
    	var items	= new Array();
    	var f		= function(frame) {
    		items.push({
    			text	: frame.title,
    			pressed	: this.active !== null ? (this.active == frame.id ? true : false) : false,
    			itemId	: frame.id
    		});
    	};
    	
    	try {
    		this.frames.each(f, this);
    	} catch(e) {
    		Ext.each(this.frames, f, this);
    	}

    	Ext.apply(cfg, {
    		defaults	: {
    			xtype       : 'button',
    			allowDepress: false,
                enableToggle: true,
                width       : 60,
                bubbleEvents: ['click']
            },
            items		: items
    	});
    	  	
    	Ext.ux.TimeframeButtonGroup.superclass.constructor.call(this, cfg);
    },
    
    initComponent	: function() {
    	Ext.ux.TimeframeButtonGroup.superclass.initComponent.call(this);
    	
    	this.addEvents(
    	    'framechange'
    	);
    	
    	this.on({
    		click	: function(button) {
    			this.noneActive();
    			
    			this.active = button.itemId;
    			button.toggle(true);
    			
    			try {
    				this.fireEvent('framechange', this.frames.get(this.active));
    			} catch(e) {
    				console.log(e);
    			}
    		},
    		scope	: this
    	});
    },
    
    noneActive		: function() {
		if(this.active) {
			this.getComponent(this.active).toggle(false);
		}
    }
	
});

Ext.reg('timeframebuttongroup', Ext.ux.TimeframeButtonGroup);