Ext.ns('Ext.iG');

Ext.iG.Menu = Ext.extend(Ext.Panel, {

	constructor : function(cfg) {
		Ext.apply(cfg, 	{
			border : true,
		    xtype : 'form',
		    frame : true,
		    bodyStyle : 'padding:5px',
		    labelAlign : 'top',
		    items : [{
		        autoScroll : true,
		        layout : 'table',
		        layoutConfig : {
		            columns : 6
		        },
		        defaults : {
		            bodyStyle : 'padding:5px'
		        },
		        items : [{
		            items : {
		                xtype : 'autocombo',
		                name : 'host',
		                url : cfg.provider.hosts,
		                plugins : [new Ext.ux.ComboController({observe : 'service'})],
		                emptyText : _('Choose Host'),
		                ref : '../../hostCmp'
		            }
		        }, {
		            items : {
		                xtype : 'autocombo',
		                name : 'service',
		                url : cfg.provider.services,
		                plugins : [new Ext.ux.ComboDependency({depends : {host : 'host'}})],
		                disabled : true,
		                emptyText : _('Choose Service'),
		                ref : '../../serviceCmp'
		            }
		        }, {
		            items : {
		                xtype : 'button',
		                text : _('Display Graph'),
		                width : 80,
		                cls : 'x-btn-text-left',
		                handler : function(self, e) {
		                    var h = this.hostCmp.getValue(),
		                        s = this.serviceCmp.getValue(),
		                        st = this.startCmp.getValue(),
		                        et = this.endCmp.getValue();
		                    
		                    if(h && s) {
		                        this.hostServiceRequest(h, s, st, et);
		                    } else if(h) {
		                    	this.hostRequest(h);
		                    }
		                },
		                scope : this
		            }
		        }, {
		            items : {
		                xtype : 'datefield',
		                format : 'Y-m-d H:i:s',
		                id : 'iG-Start',
		                fieldLabel : 'Start',
		                width : 150,
		                emptyText : _('Starttime'),
		                ref : '../../startCmp'
		            }
		        }, {
		            items : {
		                xtype : 'datefield',
		                format : 'Y-m-d H:i:s',
		                id : 'iG-End',
		                fieldLabel : 'End',
		                width : 150,
		                emptyText : _('Endtime'),
		                ref : '../../endCmp'
		            }
		        }, {
		            items : {
		                xtype : 'box',
		                autoEl : {
		                    tag : 'div'
		                }
		            },
		            rowspan : 2
		        }, {
		            items : {
		                xtype : 'autocombo',
		                name : 'view',
		                url : cfg.provider.views,
		                emptyText : _('Choose View'),
		                storeCfg : {
		                    fields : ['view', 'config']
		                },
		                width : 490,
		                ref : '../../viewCmp'
		            },
		            colspan : 2
		        }, {
		            items : {
		                xtype : 'button',
		                text : _('Display View'),
		                width : 80,
		                cls : 'x-btn-text-left',
		                handler : function(self, e) {
		                    var v = this.viewCmp.getValue();
		                    
		                    if(v) {
		                        this.viewRequest(this.viewCmp.store.getById(v).get('config'));
		                    }
		                },
		                scope : this
		            }
		        }]
		    }]
		});
		
		Ext.iG.Menu.superclass.constructor.call(this, cfg);
	}

});