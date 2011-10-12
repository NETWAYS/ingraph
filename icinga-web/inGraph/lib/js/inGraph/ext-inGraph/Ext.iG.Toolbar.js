/**
 * @class Ext.iG.Toolbar
 * @extends Ext.Toolbar
 */
Ext.ns('Ext.iG');
Ext.iG.Toolbar = Ext.extend(Ext.Toolbar, {
	firstText: _(''),
	prevText: _(''),
	nextText: _(''),
	lastText: _(''),
	refreshText: _(''),
	
	constructor: function(cfg) {
		var items = [this.first = new Ext.Toolbar.Button({
            tooltip: this.firstText,
            overflowText: this.firstText,
            iconCls: 'x-tbar-page-first',
            disabled: true,
            handler: this.moveFirst,
            scope: this
        }), this.prev = new Ext.Toolbar.Button({
            tooltip: this.prevText,
            overflowText: this.prevText,
            iconCls: 'x-tbar-page-prev',
            disabled: true,
            handler: this.movePrevious,
            scope: this
        }), '-', _('Interval'),
        this.inputItem = new Ext.form.ComboBox({
        	width: 100,
        	store: new Ext.iG.TimeFrames(),
        	valueField: 'name',
        	displayField: 'name',
        	mode: 'local',
        	triggerAction: 'all'
        }),'-', this.next = new Ext.Toolbar.Button({
            tooltip: this.nextText,
            overflowText: this.nextText,
            iconCls: 'x-tbar-page-next',
            disabled: true,
            handler: this.moveNext,
            scope: this
        }), this.last = new Ext.Toolbar.Button({
            tooltip: this.lastText,
            overflowText: this.lastText,
            iconCls: 'x-tbar-page-last',
            disabled: true,
            handler: this.moveLast,
            scope: this
        }), '-', this.refresh = new Ext.Toolbar.Button({
            tooltip: this.refreshText,
            overflowText: this.refreshText,
            iconCls: 'x-tbar-loading',
            disabled: true,
            handler: this.doRefresh,
            scope: this
        }), '-', 
        this.datapoints = new Ext.form.Checkbox({
    		boxLabel: _('Show datapoints'),
    		disabled: true,
    		scope: this,
    		handler: function(box, checked) {
    			console.log('Show datapoints:', checked);
    		},
    		style: {
    			marginTop: '0px'
    		}
    	}),
    	this.smooth = new Ext.form.Checkbox({
            boxLabel: _('Smooth'),
            disabled: true,
            scope: this,
            handler: function(box, checked) {
                console.log('Smooth', checked);
            },
            style: {
                marginTop: '0px'
            }
    	})];
        
        cfg.items = items;
        
        Ext.iG.Toolbar.superclass.constructor.call(this, cfg);
	},
	
	initComponent: function() {
		Ext.iG.Toolbar.superclass.initComponent.call(this);
		this.bindStore(this.store, true);
	},
	
    bindStore: function(store, initial){
        if(!initial && this.store){
            if(store !== this.store && this.store.autoDestroy){
                this.store.destroy();
            } else {
                this.store.un('beforeload', this.onBeforeLoad, this);
                this.store.un('load', this.onLoad, this);
            }
            if(!store){
                this.store = null;
            }
        }
//        if(store){
//            store = Ext.StoreMgr.lookup(store);
        store.on({
            scope: this,
            beforeload: this.onBeforeLoad,
            load: this.onLoad
        });
//        }
//        this.store = store;
    },
    
    onBeforeLoad: function() {
        if(this.rendered && this.refresh){
            this.refresh.disable();
        }
    },
    
    onLoad: function() {
        this.refresh.enable();
        this.datapoints.enable();
        this.smooth.enable();
    },
    
    onDestroy: function() {
        this.bindStore(null);
        Ext.iG.Toolbar.superclass.onDestroy.call(this);
    },
    
    doRefresh: function() {
    	this.store.reload();
    }
});