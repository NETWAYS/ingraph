Ext.ux.HostSummary = Ext.extend(Ext.DataView, {
	
	tpl : new Ext.XTemplate(
		'<tpl for=".">',
	    '<div class="iG-service-preview" id="{service}">',
	    '<div class="thumb"><img src="http://localhost/inGraph/images/chart.png" title="{service}"></div>',
	    '<span class="x-editable">{service}</span>',
	    '</div>',
	    '</tpl>',
	    '<div class="x-clear"></div>'
	),
	
	constructor : function(cfg) {	
		Ext.apply(cfg, {
			autoScroll : true,
			autoHeight : false,
			height : cfg.height,
	        overClass : 'x-view-over',
	        itemSelector : 'div.iG-service-preview',
	        collapsible : true,
	        emptyText : _('No Services.'),
	        store : new Ext.data.JsonStore({
	        	autoLoad : true,
                autoDestroy : true,
                url : 'data/services',
                root : 'results',
                fields : ['service'],
                totalProperty : 'total',
                paramNames : {
                    start : 'offset'
                },
                baseParams : {
                    offset : 0,
                    limit : cfg.limit,
                    host : cfg.host
                },
                idProperty : 'service'	        
	        })
		});
		
		Ext.ux.HostSummary.superclass.constructor.call(this, cfg);
	}

});