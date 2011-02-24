Ext.ns('InGraph');

// -- APPLICATION GLUE

InGraph.Application = function() {
	InGraph.Application.superclass.constructor.apply(this, arguments);
}

Ext.extend(InGraph.Application, Ext.Panel, {
	
	layout: 'border',
	border: false,
	
	constructor: function() {
		InGraph.Application.superclass.constructor.apply(this, arguments);
	},
	
	initComponent: function() {
		InGraph.Application.superclass.initComponent.call(this);
		
		this.add([{
			region: 'center',
			title: 'CENTER'
		}, {
			xtype: 'ingraph-filterpanel',
			
			region: 'north',
			
			title: 'NORTH',
			html: 'NORTH'
		}]);
	}
});

Ext.reg('ingraph-application', InGraph.Application);

// -- FORM PANEL

InGraph.FilterPanel = function() {
	InGraph.FilterPanel.superclass.constructor.apply(this, arguments);	
}

Ext.extend(InGraph.FilterPanel, Ext.form.FormPanel, {
	height: 200,
	border: false,
	
	constructor: function() {
		InGraph.FilterPanel.superclass.constructor.apply(this, arguments);
	}
});

Ext.reg('ingraph-filterpanel', InGraph.FilterPanel);