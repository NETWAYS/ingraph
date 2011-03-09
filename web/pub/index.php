<?php

require_once '../lib/inGraph/functions.php';

$host		= get_post_parameter( 'host', false );
$service	= get_post_parameter( 'service', false );
$submit		= get_post_parameter( 'submit', false );
$start		= get_post_parameter( 'start', false );
$end		= get_post_parameter( 'end', false );
$interval	= get_post_parameter( 'interval', false );

$t = array(
	'host'		=> $host,
	'service'	=> $service,
	'height'	=> 280,
	'minChars'	=> 3,
	'limit'		=> 15,
	'type'		=> 'line'
);
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    
    <title>inGraph</title>
    
    <script type="text/javascript" src="lib/protovis/protovis-d3.2.js"></script>

 	<script type="text/javascript" src="lib/ext/adapter/ext/ext-base.js"></script>
 	<script type="text/javascript" src="lib/ext/ext-all.js"></script>
 	
 	<script type="text/javascript" src="lib/inGraph/inGraph.js"></script>
    
    <link rel="stylesheet" type="text/css" href="lib/ext/resources/css/ext-all.css" />
    
    <link rel="stylesheet" type="text/css" href="styles/inGraph-layout.css" />
    <link rel="stylesheet" type="text/css" href="styles/inGraph-all.css" />
</head>
<body>
     <div id="loading-mask"></div>
     <div id="loading">
          <span id="loading-message">Loading. Please wait...</span>
     </div>
	<div id="border-top"></div>
	<div id="content">
	<div>
	<form id="iG-host-service-combination" method="post" action="index.php">
		<div class="iG-search-container">
		    <div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>
		    <div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">
		        <h3>Choose Host, Service Combination!</h3>
		        <div class="floatbox clearfix" style="padding-top:5px;">
		        <div style="float:left;">
		        <label for="iG-host">Host:</label><input type="text" name="host" id="iG-host" value="<?php echo $host ? $host : ''; ?>" />
		        </div>
		        <div style="float:left; padding-left:10px;">
		        <label for="iG-service">Service:</label><input type="text" name="service" id="iG-service" value="<?php echo $service ? $service : ''; ?>" />        
		        </div>
		        </div>
				<?php
		        if ( $submit && ( ! $host ) ) {
		        echo
<<<HTML
<div class="error">Host is required!</div>
HTML;
		        }
		        ?>
		        <div class="floatbox clearfix" style="padding-top:5px;">
		        <div style="float:left;">
		        <label for="iG-start">Start:</label><input type="text" name="start" id="iG-start" value="<?php echo $start ? $start : ''; ?>" /> 
		        </div>
		        <div style="float:left; padding-left:10px;">		        
		        <label for="iG-end">End:</label><input type="text" name="end" id="iG-end" value="<?php echo $end ? $end : ''; ?>" />
		        </div>
		        </div>
		        <div  style="padding-top:5px;">
		        <label for="graper-interval">Interval:</label><input type="text" name="interval" id="iG-interval" value="<?php echo $interval ? $interval : ''; ?>" /> 
		        </div>
		        <div  style="padding-top:5px;" class="info"><p>Search requires a minimum of <?php echo $t['minChars']; ?> characters.</p></div>
		        
		        <div  style="padding-top:5px;">
		        <input id="iG-host-service-combination-submit" type="submit" value="Plot it!" name="submit" />
		        </div>
		    </div></div></div>
		    <div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>
		</div>
	</form>
	<?php if ( $submit && $host ) {
		
		require '../actions/source.php';
		
		foreach ( $data as $host => $services ) {
			foreach ( $services as $service => $charts ) {
				foreach ( $charts as $key => $chart ) {			
					$t['title']		= "Graph for {$host}:{$service} from " . strftime('%Y-%m-%d %H:%M:%S', $chart['start']) . " to " . strftime('%Y-%m-%d %H:%M:%S', $chart['end']);
					
					$t['values']	= json_encode( $chart['data'] );
					
					$t['id']		= "{$host}-{$service}-{$key}";
					
					$t['start']		= intval( $chart['start'] );
					$t['end']		= intval( $chart['end'] );
					$t['host']		= $host;
					$t['service']	= $service;
					
					if ( $chart['context'] ) {
						require '../actions/context.php';
					} else {
						require '../actions/plot.php';
					}
				}
			}
		}
	} ?>
	
	<script type="text/javascript">
	Ext.onReady(function(){
		var limit		= <?php echo $t['limit']; ?>;
		var minChars	= <?php echo $t['minChars']; ?>;
	    
	    var hostSearch = new Ext.form.ComboBox({
		    id:				'GrapherHost',
	        store:			new Ext.data.ArrayStore({
		        autoDestroy:	true,
		        url:			'actions/hosts.php',
		        root:			'results',
		        fields:			[{name: 'name'}],
		        totalProperty:	'total',
		        paramNames:		{
			        start: 'offset'
		        },
		        baseParams:		{
			        offset: 0,
			        limit: limit
		        }
		    }),
	        queryParam:		'query',
	        listEmptyText:	'No results.',
	        lazyInit:		false,
	        triggerAction:	'all',
	        typeAhead:		false,
	        loadingText:	'Searching...',
	        pageSize:		limit,
	        hideTrigger:	true,
	        applyTo:		'iG-host',
	        minChars:		minChars,
	        valueField:		'name',
	        displayField:	'name',
	        listeners:		{
		        focus: function() {
			        this.hasFocus = true;
			        this.doQuery( '', true );
		        },
		        select: function( self, record, index ) {
			        Ext.getCmp( 'GrapherService' ).enable();
			        Ext.getCmp( 'GrapherService' ).clearValue();
		        }
	        }
	    });

	    var serviceSearch = new Ext.form.ComboBox({
	    	id:				'GrapherService',
	        store:			new Ext.data.ArrayStore({
		        autoDestroy:	true,
		        url:			'actions/services.php',
		        root:			'results',
		        fields:			[{name: 'name'}],
		        totalProperty:	'total',
		        paramNames:		{
			        start: 'offset'
		        },
		        baseParams:		{
			        offset: 0,
			        limit: limit
		        },
		        listeners:		{
			        beforeload: function( self, options ) {
				        options.params['host'] = Ext.getCmp( 'GrapherHost' ).getValue();
				        return true;
				    }
		        }
		    }),
	        queryParam:		'query',
	        lazyInit:		false,
	        typeAhead:		false,
	        loadingText:	'Searching...',
	        pageSize:		limit,
	        triggerAction:	'all',
	        minChars:		minChars,
	        hideTrigger:	true,
	        applyTo:		'iG-service',
	        valueField:		'name',
	        displayField:	'name',
	        disabled:		'<?php echo $host; ?>' ? false : true,
	        listeners:		{
		        focus: function() {
			        this.hasFocus = true;
			        this.getStore().load();
		        }
	        }
	    });

	    var start = new Ext.form.DateField({
		    id:			'GrapherStart',
		    applyTo:	'iG-start',
		    format:		'Y-m-d H:i:s'
	    });

	    var end = new Ext.form.DateField({
		    id:			'GrapherEnd',
		    applyTo:	'iG-end',
		    format:		'Y-m-d H:i:s'
	    });

	    var interval = new Ext.form.ComboBox({
		    id:				'GrapherInterval',
	        store:			new Ext.data.JsonStore({
		        autoDestroy:	true,
		        url:			'actions/intervals.php',
		        root:			'results',
		        fields:			['interval'],
		        totalProperty:	'total',
		        paramNames:		{
			        start: 'offset'
		        },
		        baseParams:		{
			        offset: 0,
			        limit: limit
		        }
		    }),
	        queryParam:		'query',
	        listEmptyText:	'No results.',
	        lazyInit:		false,
	        triggerAction:	'all',
	        typeAhead:		false,
	        loadingText:	'Searching...',
	        pageSize:		limit,
	        hideTrigger:	true,
	        applyTo:		'iG-interval',
	        minChars:		minChars,
	        valueField:		'interval',
	        displayField:	'interval',
	        listeners:		{
		        focus: function() {
			        this.hasFocus = true;
			        this.doQuery( '', true );
		        }
	        }
	    });

	    function updateResolution() {
	    	height = iG.height();

	    	Ext.get('content').setWidth(iG.width(), true);
	    	Ext.get('border-top').setStyle('margin-bottom', ((height/-2).toFixed(0).toString()) + "px");

	    	iG.RenderControl.fireEvent('updated');	
	    }

		Ext.EventManager.addListener(window, 'resize', updateResolution);
	    
	    updateResolution();

         var loadingMask = Ext.get('loading-mask');
         var loading = Ext.get('loading');
         loading.fadeOut({ duration: 1, remove: true });
         loadingMask.setOpacity(0.9);
         loadingMask.shift({
              xy: loading.getXY(),
              width: loading.getWidth(),
              height: loading.getHeight(),
              remove: true,
              duration: 0.3,
              opacity: 0.1,
              easing: 'easeOut'
         });
	});	
	</script>
	</div></div>
</body>
</html>