<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
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
    
    <script type="text/javascript" src="lib/ext/adapter/jquery/ext-jquery-adapter-debug.js"></script>
    <script type="text/javascript" src="lib/ext/ext-all-debug.js"></script>
    
    <script type="text/javascript" src="lib/inGraph/inGraph.js"></script>
    
    <script type="text/javascript" src="lib/inGraph/Ext.ux.Flot.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.FlotJsonReader.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.FlotJsonStore.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.TimeframeButtonGroup.js"></script>
    <script type="text/javascript" src="lib/inGraph/Ext.ux.FlotPanel.js"></script>
    
    <link rel="stylesheet" type="text/css" href="lib/ext/resources/css/ext-all-notheme.css" />
    <link rel="stylesheet" type="text/css" href="lib/ext/resources/css/xtheme-gray.css" />
    
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
	Ext.ux.TimeframeButtonGroup.prototype.frames = iG.timeFrames.getAll();

    /*
    var d = new Date();
    console.log(d.getTimezoneOffset());
    */
    
    var limit       = 10;
    var minChars    = 3;

    /*
    Ext.fly('flot').setSize(800,300);
    $.plot($('#flot'), [{data: [[1,1],[2,4],[3,1],[4,2]], color: 'red'}, {data: [[1,3],[2,3],[3,3],[4,3]], color: 'red', points: {radius: 0, lineWidth: 0}}], {
        series: {
            lines: {
                show: true,
                lineWidth: 1,
                spline: true,
                splinen: 20
            },
            points: {
                show: true
            }
        },
        grid: {
            hoverable: true
        }
    });

    $('#flot').bind('plothover', function(event, pos, item) {
        console.log(item);
    });
    */

    var viewport = new Ext.Viewport({
        layout  : 'border',
        items   : [{
            region          : 'north',
            border          : true,
            height          : 150,
            xtype           : 'form',
            frame           : true,
            bodyStyle       : 'padding: 5px',
            labelAlign      : 'top',
            items           : [{
                layout  : 'column',

                defaults: {
                    columnWidth : .15,
                    layout      : 'form',
                    anchor      : '95%',
                },

                items   : [{

                    items: [{
	                    xtype           : 'combo',
	                    minChars        : minChars,
	                    pageSize        : limit,
	                    triggerAction   : 'all',
	                    hideTrigger     : true,
	                    listEmptyText   : 'No results...',
	                    editable        : true,
	                    
	                    id          : 'iG-Host',
	                    hiddenName  : 'host',
	                    fieldLabel  : 'Host',
	                    queryParam  : 'host',
	                    store       : new Ext.data.JsonStore({
	                        autoDestroy     : true,
	                        url             : 'actions/hosts.php',
	                        root            : 'results',
	                        fields          : ['host'],
	                        totalProperty   : 'total',
	                        paramNames      : {
	                            start   : 'offset'
	                        },
	                        baseParams:     {
	                            offset  : 0,
	                            limit   : limit
	                        }
	                    }),
	                    valueField      : 'host',
	                    displayField    : 'host',
	                    listeners       : {
	                        focus   : function() {
	                            this.getStore().load();
	                        },
	                        select  : function() {
	                            Ext.getCmp('iG-Service').enable();
	                            Ext.getCmp('iG-Service').clearValue();
	                        },
	                        change  : function(self, value) {
	                            if(value) {
	                                Ext.getCmp('iG-Service').enable();
	                            } else {
	                                Ext.getCmp('iG-Service').disable();
	                            }
	                            Ext.getCmp('iG-Service').clearValue();
	                        }
	                    }
                    }, {
                        xtype           : 'datefield',
                        format	        : 'Y-m-d H:i:s',
                        validationEvent	: false,
                        validateOnBlur	: false,

                        id	            : 'iG-Start',
                        fieldLabel	    : 'Start'
                    }]
                }, {
	                items: [{
	                    xtype           : 'combo',
	                    minChars        : minChars,
	                    pageSize        : limit,
	                    triggerAction   : 'all',
	                    hideTrigger     : true,
	                    listEmptyText   : 'No results...',
	                    editable        : true,
	                    
	                    id          : 'iG-Service',
	                    hiddenName  : 'service',
	                    fieldLabel  : 'Service',
	                    queryParam  : 'service',
	                    store       : new Ext.data.JsonStore({
	                        autoDestroy     : true,
	                        url             : 'actions/services.php',
	                        root            : 'results',
	                        fields          : ['service'],
	                        totalProperty   : 'total',
	                        paramNames      : {
	                            start   : 'offset'
	                        },
	                        baseParams      : {
	                            offset  : 0,
	                            limit   : limit
	                        },
	                        listeners:      {
	                            beforeload   : function(self, options) {
	                                options.params['host'] = Ext.getCmp('iG-Host').getValue();
	                                return true;
	                            }
	                        }
                        }),
                        valueField      : 'service',
                        displayField    : 'service',
                        disabled        : true,
                        listeners       : {
                            focus   : function() {
                                this.getStore().load();
                            }
                        }
	                }, {
                        xtype           : 'datefield',
                        format	        : 'Y-m-d H:i:s',
                        validationEvent	: false,
                        validateOnBlur	: false,

                        id	            : 'iG-End',
                        fieldLabel	    : 'End'
                    }]
                }]
            }],
            buttonAlign: 'left',
            buttons    : [{
                text       : 'Display',
                formBind   : true,
                handler    : function(self, e) {
                    var h   = Ext.getCmp('iG-Host').getValue(),
                        s   = Ext.getCmp('iG-Service').getValue(),
                        st  = Ext.getCmp('iG-Start').getValue(),
                        et  = Ext.getCmp('iG-End').getValue();

                    if(h && s) {
                        if(st || et) {
                            frames = [{
                                    title   : 'Custom Timerange',
                                    start   : st || '',
                                    end     : et || ''
                            }];
                        }
                        
                        var tab = viewport.hostServiceTabs.items.find(function(t) {
                            return t.title === '{0} - {1}'.format(h, s);
                        });

                        if(!tab) {
                            var panels = new Array();
                            
                            iG.timeFrames.getDefault().each(function(frame) {                       
                            	panels.push({
                                    xtype       : 'flotpanel',
                                    title       : frame.title,
                                    bodyStyle   : 'padding: 5px',
                                    store       : new Ext.ux.FlotJsonStore({
                                        url         : 'actions/source_json.php',
                                        baseParams  : {
                                            host    : h,
                                            service : s,
                                            start   : frame.start,
                                            end     : frame.end || ''
                                        }
                                    }),
                                    frame       : frame,
                                    overview    : frame.overview
                                });
                            });

                            tab = viewport.hostServiceTabs.add({
                                title       : '{0} - {1}'.format(h, s),
                                header      : false,
                                autoScroll  : true,
                                defaults: {
                                    collapsible: true
                                },
                                items   : panels
                            });
                        }

                        viewport.hostServiceTabs.setActiveTab(tab);
                    }
                }
            }]
        }, {
            region      : 'center',
            xtype       : 'tabpanel',
            ref         : 'hostServiceTabs',
            defaults    : {
                closable: true
            }
        }]
    });

    viewport.doLayout();
});
</script>
</body>
</html>