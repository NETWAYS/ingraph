Ext.ns('Ext.iG');

Ext.iG.Menu = Ext.extend(Ext.Panel, {

    constructor : function(cfg) {
        Ext.apply(cfg,  {
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
                        plugins : [new Ext.ux.ComboController({control : {scope : this, cmp : 'serviceCmp'}})],
                        emptyText : _('Choose Host'),
                        ref : '../../hostCmp'
                    }
                }, {
                    items : {
                        xtype : 'autocombo',
                        name : 'service',
                        url : cfg.provider.services,
                        plugins : [new Ext.ux.ComboDependency({depends : {scope : this, param : 'host', cmp : 'hostCmp'}})],
                        disabled : true,
                        emptyText : _('Choose Service'),
                        ref : '../../serviceCmp'
                    }
                }, {
                    items : {
                        xtype : 'splitbutton',
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
                            
                            this.fireEvent('plotrequest', this);
                        },
                        scope : this,
                        menu : {
                            ignoreParentClicks : true,
                            items : [{
                                xtype : 'menutextitem',
                                text : _('Choose graphs to plot'),
                                style : {
                                    'border' : '1px solid #999999',
                                    'background-color' : '#D6E3F2',
                                    'margin' : "0px 0px 1px 0px",
                                    'display' : 'block',
                                    'padding' : '3px',
                                    'font-weight' : 'bold',
                                    'font-size' : '12px',
                                    'text-align' : 'center'
                                }
                            }, (function() {
                                var frames = new Array();
                                
                                iG.timeFrames.getAll().each(function(frame) {
                                    frames.push({
                                        text : (function(frame) {
                                            var title = frame.title;
                                            if(frame.overview) {
                                                title = String.format(
                                                    '{0}, {1}',
                                                    title,
                                                    _('Overview')
                                                );
                                            }
                                            return title;
                                        })(frame),
                                        checked : frame.show,
                                        frameKey : iG.timeFrames.getAll().getKey(frame),
                                        handler : function(c) {
                                            this.timeFrames.get(c.frameKey).show = !c.checked;
                                        },
                                        scope : this
                                    });
                                }, this);
                                
                                return frames;
                            }).call(this)]
                        }
                    }
                }, {
                    items : {
                        xtype : 'datefield',
                        format : 'Y-m-d H:i:s',
                        fieldLabel : 'Start',
                        width : 150,
                        emptyText : _('Starttime'),
                        ref : '../../startCmp'
                    }
                }, {
                    items : {
                        xtype : 'datefield',
                        format : 'Y-m-d H:i:s',
                        fieldLabel : 'End',
                        width : 150,
                        emptyText : _('Endtime'),
                        ref : '../../endCmp'
                    }
                }, {
                    items : {
                        xtype : 'box',
                        autoEl : {
                            tag : 'img',
                            src : 'images/ingraph_logo.png'
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
                            
                            this.fireEvent('plotrequest', this);
                        },
                        scope : this
                    }
                }]
            }],
            
            stateful : true,
            
            stateEvents : ['plotrequest']
        });
        
        this.addEvents('plotrequest');
        
        Ext.iG.Menu.superclass.constructor.call(this, cfg);
    },
    
    applyState : function(state) {
        Ext.iterate(state.cts, function(chunk, ct) {
            var panels = new Array();
            
            Ext.each(ct.panels, function(panel) {
                panel.frame = iG.timeFrames.getAll().key(panel.frame.id);
                var storeCfg = panel.storeCfg;
                delete panel.storeCfg;
                storeCfg.baseParams.start = panel.frame.start();
                storeCfg.baseParams.end = panel.frame.end();
                
                panels.push(Ext.apply({
                    xtype : 'flotpanel',
                    bodyStyle : 'padding : 5px',
                    store : new Ext.iG.FlotJsonStore(storeCfg)
                }, panel));
            });
            
            this.iGLayout.getContainer().add({
                title : ct.title,
                header : false,
                autoScroll : true,
                layout : panels.length > 1 ? 'vbox' : 'absolute',
                defaults : {
                    collapsible : true
                },
                items : panels
            });
        }, this);
        
        this.iGLayout.getContainer().doLayout();
    },
    
    getState : function() {
        var cts = {};
        
        Ext.each(this.iGLayout.getContainer().findByType('flotpanel'), function(fp) {
            if(!(fp.ownerCt.id in cts)) {
                cts[fp.ownerCt.id] = {
                    title : fp.ownerCt.title,
                    panels : new Array()
                };
            }
            
            var cfg = Ext.copyTo({
                    storeCfg : {}
                },
                fp.initialConfig,
                ['title', 'host', 'service', 'frame', 'titleFormat', 'overview']
            );
            
            Ext.copyTo(
                cfg.storeCfg,
                fp.store,
                ['url', 'baseParams']
            );
            
            cts[fp.ownerCt.id].panels.push(cfg);
        });
        
        return {
            cts : cts
        };
    }

});
