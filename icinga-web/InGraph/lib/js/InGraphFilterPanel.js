Ext.ns('InGraph');

InGraph.FilterPanel = function() {
	InGraph.FilterPanel.superclass.constructor.apply(this, arguments);
}

Ext.extend(InGraph.FilterPanel, Ext.form.FormPanel, {
	height: 200,
	
	constructor: function() {
		InGraph.FilterPanel.superclass.constructor.apply(this, arguments);
	},
	
	initComponent: function() {
		InGraph.FilterPanel.superclass.initComponent.call(this);
		
		this.add({
			bodyStyle: {
				margin: '5px 5px'
			},
			
			xtype: 'panel',
			layout: 'form',
			border: false,
			frame: true,
			width: 500,
			
			defaults: {
				border: false
			},
			
			items: [{
				xtype: 'combo',
				fieldLabel: _('Host')
			}, {
				xtype: 'dataview',
				fieldLabel: _('Service')
			}]
		});
	}
});

Ext.reg('ingraph-filterpanel', InGraph.FilterPanel);