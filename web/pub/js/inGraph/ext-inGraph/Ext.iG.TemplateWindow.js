Ext.ns('Ext.iG');

Ext.iG.TemplateWindow = Ext.extend(Ext.Window, {
	
    layout : 'fit',
    
    width : 640,
    
    height : 480,
    
    border : true,
    
    closable : true,
    
    closeAction : 'hide',
    
    collapsible : true,
    
    autoScroll : true,
    
    title : _('Template'),
    
    constrain : true,
    
    modal : true,
    
    renderTo : Ext.getBody(),
    
	constructor : function(cfg) {
		cfg = cfg || {};
		
		var hcid = Ext.id(),
			scid = Ext.id();
		
		Ext.apply(cfg, {
			items : [{
				xtype : 'tabpanel',
		        activeItem : 0,
		        items : [{
		        	title : _('Series'),
		        	xtype : 'editorgrid',
		        	clicksToEdit : 1,
		        	plugins : ['checkcolumn'],
		        	store : cfg.store,
					cm : new Ext.grid.ColumnModel({
						defaults: {
					        width : 120,
					        sortable : true
					    },
					    columns: [{
				        	xtype : 'checkcolumn',
				        	header : _('Disabled'),
				        	dataIndex : 'disabled',
				        	width : 55
				        }, {
				        	header : _('Label'),
				        	dataIndex : 'label'
				        }, {
				        	header : _('Color'),
				        	dataIndex : 'color',
				        	editor : new Ext.ux.ColorField()
				        }]
					})
		        }, {
		            title : _('Datasource'),
		            xtype : 'form',
		            autoHeight : true,
		            items : [{
	                    xtype : 'autocombo',
	                    name : 'host',
	                    url : 'data/hosts',
	                    id : Ext.ux.idInterface.prototype.formatId(hcid),
	                    plugins : [new Ext.ux.ComboController({observe : scid})],
	                    emptyText : _('Choose Host')
		        	}, {
	                    xtype : 'autocombo',
	                    name : 'service',
	                    url : 'data/services',
	                    id : Ext.ux.idInterface.prototype.formatId(scid),
	                    plugins : [new Ext.ux.ComboDependency({depends : {host : hcid}})],
	                    disabled : true,
	                    emptyText : _('Choose Service'),
	                    listeners : {
	                    	select : function() {
                				var h = Ext.getCmp(Ext.ux.idInterface.prototype.formatId(hcid)).getValue(),
                					s = Ext.getCmp(Ext.ux.idInterface.prototype.formatId(scid)).getValue();
                				
                				this.fireEvent('sourcechange', this, h, s);
	                    	},
	                    	scope : this
	                    }
		        	}]
		        }]
			}]
		});
		
		Ext.iG.TemplateWindow.superclass.constructor.call(this, cfg);
	},

	initComponent : function() {
		Ext.iG.TemplateWindow.superclass.initComponent.call(this);
		
		this.addEvents(
		    'sourcechange'
		);
	}
	
});