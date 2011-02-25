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
			providerHosts: this.providerHosts,
			providerServices: this.providerServices
			
		}]);
	}
});

Ext.reg('ingraph-application', InGraph.Application);
