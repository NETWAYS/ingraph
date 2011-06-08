<div id="flot"></div>
<?php
$t = array_merge(array(
    'height'    => 280,
    'minChars'  => 3,
    'limit'     => 15,
    'type'      => 'line'
), $t);
?>

<script type="text/javascript">
Ext.onReady(function() {
	Ext.QuickTips.init();

	Ext.Ajax.timeout = 10*60*1000;

	Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();
    
    var limit = 10,
        minChars = 3,
        inputWidth = 240;

    /*
    Ext.fly('flot').setSize(800,300);
    $.plot($('#flot'), [{data : [[1,1],[2,1],[3,1],[4,1]], color : 'red', id : 'red', lines : {fill : false}}, {data : [[1,10],[2,10],[3,10],[4,10]], color : 'yellow', id : 'yellow', fillBetween : 'red'}, {data : [[1,5],[2,5],[3,5],[4,5]], color : 'green', id : 'green', lines : {fill : false}}], {
        series : {
            lines : {
                show : true,
                lineWidth : 1,
                spline : false,
                splinen : 20,
                fill : true
            },
            points : {
                show : true
            }
        },
        grid : {
            hoverable : true
        }
    });
    */
    
    var viewport = new Ext.Viewport({
        boxMinWidth : 400,
        layout : 'border',
        items : [{
            region : 'north',
            border : true,
            height : 90,
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
	                    url : 'data/hosts',
	                    plugins : [new Ext.ux.ComboController({observe : 'service'})],
	                    width : 240,
	                    emptyText : _('Choose Host')
                    }
                }, {
                    items : {
	                    xtype : 'autocombo',
	                    name : 'service',
	                    url : 'data/services',
	                    plugins : [new Ext.ux.ComboDependency({depends : {host : 'host'}})],
	                    disabled : true,
	                    width : 240,
	                    emptyText : _('Choose Service')
                    }
                }, {
                    items : {
	                    xtype : 'button',
	                    text : _('Display Graph'),
	                    width : 80,
                        cls : 'x-btn-text-left',
                        handler : function(self, e) {
                            var h   = Ext.getCmp('iG-host').getValue(),
                                s   = Ext.getCmp('iG-service').getValue(),
                                st  = Ext.getCmp('iG-Start').getValue(),
                                et  = Ext.getCmp('iG-End').getValue();

                            if(h && s) {
                                var frames = iG.timeFrames.getDefault();
                                
                                if(st || et) {
                                    frames.clear();
                                    frames.add({
                                        title : 'Custom Timerange',
                                        start : iG.functor(st ? st.getTime()/1000 : ''),
                                        end : iG.functor(et ? et.getTime()/1000 : Math.ceil((new Date()).getTime()/1000))
                                    });
                                }
                                
                                var tab = viewport.hostServiceTabs.items.find(function(t) {
                                    return t.title === '{0} - {1}'.format(h, s);
                                });

                                if(tab) {
                                    Ext.destroy(tab);
                                }

                                var panels = new Array();
                                    
                                frames.each(function(frame) {         
                                    panels.push({
                                        xtype : 'flotpanel',
                                        title : frame.title,
                                        host : h,
                                        service : s,
                                        bodyStyle : 'padding : 5px',
                                        store : new Ext.ux.FlotJsonStore({
                                            url : 'data/plots',
                                            baseParams : {
                                                host : h,
                                                service : s,
                                                start : frame.start(),
                                                end : frame.end()
                                            }
                                        }),
                                        frame : frame,
                                        overview : frame.overview
                                    });
                                });
                                
                                tab = viewport.hostServiceTabs.add({
                                    title : '{0} - {1}'.format(h, s),
                                    header : false,
                                    autoScroll : true,
                                    defaults : {
                                        collapsible : true
                                    },
                                    items : panels
                                });

                                viewport.hostServiceTabs.setActiveTab(tab);
                            }
                        }
                    }
                }, {
                    items : {
	                    xtype : 'datefield',
	                    format : 'Y-m-d H:i:s',
	                    id : 'iG-Start',
	                    fieldLabel : 'Start',
	                    width : 150,
	                    emptyText : _('Starttime')
                    }
                }, {
                    items : {
	                    xtype : 'datefield',
	                    format : 'Y-m-d H:i:s',
	                    id : 'iG-End',
	                    fieldLabel : 'End',
	                    width : 150,
	                    emptyText : _('Endtime')
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
	                    url : 'data/views',
	                    emptyText : _('Choose View'),
                        storeCfg : {
                            fields : ['view', 'config']
                        },
	                    width : 490
                    },
                    colspan : 2
                }, {
                    items : {
	                    xtype : 'button',
	                    text : _('Display View'),
	                    width : 80,
                        cls : 'x-btn-text-left',
                        handler : function(self, e) {
                            var v = Ext.getCmp('iG-view'),
                                c = v.store.getById(v.getValue()).get('config'),
                                panels = new Array();

                            c.title = c.title || 'View';
                            
                            var tab = viewport.hostServiceTabs.items.find(function(t) {
                                return t.title === c.title;
                            });
                            
                            if(tab) {
                                Ext.destroy(tab);
                            }
                            
                            Ext.each(c.panels, function(panelCfg) {
                                var start = panelCfg.start || '';
                                if(start) {
                                    start = strtotime(start);
                                    if(start) {
                                        start = Math.ceil(start);
                                    } else {
                                        start = '';
                                    }
                                }
                                var end = panelCfg.end;
                                if(end) {
                                    end = strtotime(end);
                                    if(end) {
                                        end = Math.ceil(end);
                                    } else {
                                        end = Math.ceil((new Date()).getTime()/1000);
                                    }
                                } else {
                                    end = Math.ceil((new Date()).getTime()/1000);
                                }                    

                                
                                
                                var frame = {
                                    title : panelCfg.title || 'Panel',
                                    start : iG.functor(start),
                                    end : iG.functor(end)
                                };
                                
                                panels.push({
                                    xtype : 'flotpanel',
                                    titleFormat : '{frame}',
                                    title : frame.title,
                                    frame : frame,
                                    bodyStyle : 'padding : 5px',
                                    store : new Ext.ux.FlotJsonStore({
                                        url : 'data/combined',
                                        baseParams : {
                                            config : Ext.encode({
                                                data : Ext.isArray(panelCfg.data) ? panelCfg.data : new Array(panelCfg.data),
                                                flot : c.flot || {},
                                                generic : c.generic || {}
                                            }),
                                            start : frame.start(),
                                            end : frame.end(),
                                            interval : panelCfg.interval || ''
                                        }
                                    })
                                });
                            });

                            tab = viewport.hostServiceTabs.add({
                                title : c.title,
                                header : false,
                                autoScroll : true,
                                defaults : {
                                    collapsible : true
                                },
                                items : panels
                            });

                            viewport.hostServiceTabs.setActiveTab(tab);
                        }
                    }
                }]
            }]
        }, {
            region : 'center',
            xtype : 'tabpanel',
            plugins : [new Ext.ux.TabScrollerMenu()],
            enableTabScroll : true,
            ref : 'hostServiceTabs',
            defaults : {
                closable : true
            }
            <?php if($t['host']) {
            	echo
<<<HOSTSUMMARY
			,activeTab : 0
			,items : new Ext.ux.HostSummary({
				host : '${t['host']}',
				height : 200,
				limit : 20,
				title : '{0} {1}'.format(_('Services for'), '${t['host']}'),
				listeners : {
					click : function(hs, index, node) {
						var service = hs.getRecord(node).get('service'),
							frames = iG.timeFrames.getDefault(),
							tabCt = hs.ownerCt,
							tab = tabCt.items.find(function(t) {
								return t.title === '{0} - {1}'.format(hs.host, service);
							}),
							panels = new Array();
							
						if(tab) {
							Ext.destroy(tab);
						}
						
						frames.each(function(frame) {         
							panels.push({
								xtype : 'flotpanel',
								title : frame.title,
								host : hs.host,
								service : service,
								bodyStyle : 'padding : 5px',
								store : new Ext.ux.FlotJsonStore({
									url : 'data/plots',
									baseParams : {
										host : hs.host,
										service : service,
										start : frame.start(),
										end : frame.end()
									}
								}),
								frame : frame,
								overview : frame.overview
							});
						});
							
						tab = viewport.hostServiceTabs.add({
							title : '{0} - {1}'.format(hs.host, service),
							header : false,
							autoScroll : true,
							defaults : {
								collapsible : true
							},
							items : panels
						});
						
						tabCt.setActiveTab(tab);
					}
				}
			})
HOSTSUMMARY;
            }
            ?>
        }]
    });

    viewport.doLayout();
});
</script>
