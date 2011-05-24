<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http : //www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
    
    <title>inGraph</title>

    <script type="text/javascript" src="lib/jquery/jquery-1.5.2.js"></script>
    
    <script type="text/javascript" src="lib/excanvas/excanvas.js"></script>
    
    <script type="text/javascript" src="lib/flot/jquery.flot.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.text.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.selection.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.stack.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.fillbetween.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.threshold.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.resize.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.spline.js"></script>
    <script type="text/javascript" src="lib/flot/jquery.flot.highlight.js"></script>
    
    <script type="text/javascript" src="lib/ext/adapter/jquery/ext-jquery-adapter-debug.js"></script>
    <script type="text/javascript" src="lib/ext/ext-all-debug.js"></script>
    
    <script type="text/javascript" src="lib/ext/examples/ux/TabScrollerMenu.js"></script>
    <script type="text/javascript" src="lib/ext/examples/ux/CheckColumn.js"></script>
    
    <script type="text/javascript" src="lib/inGraph/inGraph.js"></script>
    
    <script type="text/javascript" src="lib/inGraph/Ext.form.DateField.parseDate.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.data.Store.autoRefresh.js"></script>
    
    <script type="text/javascript" src="lib/inGraph/Ext.ux.util.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.ColorField.js"></script>
    
    <script type="text/javascript" src="lib/inGraph/Ext.ux.Flot.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.FlotJsonReader.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.FlotJsonStore.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.TimeframeButtonGroup.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.FlotPanel.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.idInterface.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.AutoComboBox.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.ComboController.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.ComboDependency.js"></script>
    
    <link rel="stylesheet" type="text/css" href="lib/ext/resources/css/ext-all-notheme.css" />
    <link rel="stylesheet" type="text/css" href="lib/ext/resources/css/xtheme-gray.css" />
    
    <link rel="stylesheet" type="text/css" href="lib/inGraph/Ext.ux.ColorField.css" />
    
    <link rel="stylesheet" type="text/css" href="styles/inGraph-layout.css" />
    <link rel="stylesheet" type="text/css" href="styles/inGraph-all.css" />
    <link rel="stylesheet" type="text/css" href="styles/inGraph-icons.css" />
</head>
<body>
<div id="flot"></div>
<?php

require_once '../lib/inGraph/functions.php';

$host       = get_post_parameter( 'host', false );
$service    = get_post_parameter( 'service', false );
$submit     = get_post_parameter( 'submit', false );
$start      = get_post_parameter( 'start', false );
$end        = get_post_parameter( 'end', false );
$interval   = get_post_parameter( 'interval', false );

$t = array(
    'host'      => $host,
    'service'   => $service,
    'height'    => 280,
    'minChars'  => 3,
    'limit'     => 15,
    'type'      => 'line'
);
?>

<script type="text/javascript">
Ext.onReady(function() {
	Ext.QuickTips.init();

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
            height : 150,
            xtype : 'form',
            frame : true,
            bodyStyle : 'padding : 5px',
            labelAlign : 'top',
            items : [{
                layout : 'column',
                width : 700,
                defaults : {
                    columnWidth : .40,
                    layout : 'form',
                    anchor : '70%'
                },

                items : [{
                    defaults : {
                        width : inputWidth
                    },
                    items : [{
	                    xtype : 'autocombo',
                        name : 'host',
                        url : 'actions/hosts.php',
                        plugins : [new Ext.ux.ComboController({observe : 'service'})]
                    }, {
                        xtype : 'datefield',
                        format : 'Y-m-d H:i:s',
                        id : 'iG-Start',
                        fieldLabel : 'Start'
                    }]
                }, {
                    defaults : {
                        width : inputWidth
                    },
	                items : [{
	                    xtype : 'autocombo',
                        name : 'service',
                        url : 'actions/services.php',
                        plugins : [new Ext.ux.ComboDependency({depends : {host : 'host'}})],
                        disabled : true
	                }, {
                        xtype : 'datefield',
                        format : 'Y-m-d H:i:s',
                        id : 'iG-End',
                        fieldLabel : 'End'
                    }]
                }]
            }],
            buttonAlign : 'left',
            buttons : [{
                text : 'Display',
                formBind : true,
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
                                end : iG.functor(et ? et.getTime()/1000 : '')
                            });
                        }
                        
                        var tab = viewport.hostServiceTabs.items.find(function(t) {
                            return t.title === '{0} - {1}'.format(h, s);
                        });

                        if(!tab) {
                            var panels = new Array();
                            
                            frames.each(function(frame) {         
                            	panels.push({
                                    xtype : 'flotpanel',
                                    title : frame.title,
                                    host : h,
                                    service : s,
                                    bodyStyle : 'padding : 5px',
                                    store : new Ext.ux.FlotJsonStore({
                                        url : 'actions/source_json.php',
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
                        }

                        viewport.hostServiceTabs.setActiveTab(tab);
                    }
                }
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
        }]
    });

    viewport.doLayout();
});
</script>
</body>
</html>