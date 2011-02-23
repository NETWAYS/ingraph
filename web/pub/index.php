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
	'width'		=> 450,
	'height'	=> 280,
	'minChars'	=> 3,
	'limit'		=> 15,
	'type'		=> 'line'
);
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    
    <title>grapher-protovis</title>
    
    <script type="text/javascript" src="lib/protovis/protovis-d3.2.js"></script>

 	<script type="text/javascript" src="lib/ext/adapter/ext/ext-base.js"></script>
 	<script type="text/javascript" src="lib/ext/ext-all.js"></script>
 	
 	<script type="text/javascript" src="lib/inGraph/inGraph.js"></script>
    
    <link rel="stylesheet" type="text/css" href="lib/ext/resources/css/ext-all.css" />
    
    <link rel="stylesheet" type="text/css" href="styles/layout.css" />
    <link rel="stylesheet" type="text/css" href="styles/grapher-all.css" />
</head>
<body>

	<form id="grapher-host-service-combination" method="post" action="index.php">
		<div class="grapher-search-container">
		    <div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>
		    <div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">
		        <h3>Choose Host, Service Combination!</h3>
		        <label for="grapher-host">Host:</label><input type="text" name="host" id="grapher-host" value="<?php echo $host ? $host : ''; ?>" />
		        <label for="grapher-service">Service:</label><input type="text" name="service" id="grapher-service" value="<?php echo $service ? $service : ''; ?>" />        
		        <?php
		        if ( $submit && ( ! $host ) ) {
		        echo
<<<HTML
<div class="error">Host is required!</div>
HTML;
		        }
		        ?>
		        <label for="grapher-start">Start:</label><input type="text" name="start" id="grapher-start" value="<?php echo $start ? $start : ''; ?>" /> 
		        <label for="grapher-end">End:</label><input type="text" name="end" id="grapher-end" value="<?php echo $end ? $end : ''; ?>" />
		        <label for="graper-interval">Interval:</label><input type="text" name="interval" id="grapher-interval" value="<?php echo $interval ? $interval : ''; ?>" /> 
		        <div class="info"><p>Search requires a minimum of <?php echo $t['minChars']; ?> characters.</p></div>
		        
		        <input id="grapher-host-service-combination-submit" type="submit" value="Plot it!" name="submit" />
		    </div></div></div>
		    <div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>
		</div>
	</form>
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
	        applyTo:		'grapher-host',
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
	        store:			new Ext.data.JsonStore({
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
	        applyTo:		'grapher-service',
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
		    applyTo:	'grapher-start',
		    format:		'Y-m-d H:i:s'
	    });

	    var end = new Ext.form.DateField({
		    id:			'GrapherEnd',
		    applyTo:	'grapher-end',
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
	        applyTo:		'grapher-interval',
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
	});	
	</script>
	
	<?php if ( $submit && $host ) {
		
		require '../actions/source.php';
		
		$t['data'] = $data;
		
		foreach ( $data as $key => $hose ) {
			
			if ( ! $hose['data']['charts'] ) {
				continue;
			}
			
			$title	= "Graph for {$hose['host']}:{$hose['service']} of last ";
			$time	= array();
			
			if ( $hose['frame']['tm_year'] ) {
				$timep = '';
				if ( $hose['frame']['tm_year'] == 1 ) {
					$timep .= 'year';
				} else {
					$timep .= "{$hose['frame']['tm_year']} years";
				}
				$time[] = $timep;
			}
			
			if ( $hose['frame']['tm_mon'] ) {
				$timep = '';
				if ( $hose['frame']['tm_mon'] == 1 ) {
					if ( $time ) {
						$timep .= '1 ';
					}
					$timep .= 'month';
				} else {
					$timep .= "{$hose['frame']['tm_mon']} months";
				}
				$time[] = $timep;
			}
			
			if ( $hose['frame']['tm_mday'] && $hose['frame']['tm_mday'] % 7 == 0 ) {
				$timep = '';
				if ( $hose['frame']['tm_mday'] / 7 == 1 ) {
					if ( $time ) {
						$timep .= '1 ';
					}
					$timep .= 'week';
				} else {
					$timep .= $hose['frame']['tm_mday'] / 7 . ' weeks';
				}
				$time[] = $timep;
			} elseif ( $hose['frame']['tm_mday'] ) {
				$timep = '';
				if ( $hose['frame']['tm_mday'] == 1 ) {
					if ( $time ) {
						$timep .= '1 ';
					}
					$timep .= 'day';
				} else {
					$timep .= "{$hose['frame']['tm_mday']} days";
				}
				$time[] = $timep;
			}
			
			if ( $hose['frame']['tm_hour'] ) {
				$timep = '';
				if ( $hose['frame']['tm_hour'] == 1 ) {
					if ( $time ) {
						$timep .= '1 ';
					}
					$timep .= 'hour';
				} else {
					$timep .= "{$hose['frame']['tm_hour']} hours";
				}
				$time[] = $timep;
			}
			
			if ( $hose['frame']['tm_min'] ) {
				$timep = '';
				if ( $hose['frame']['tm_min'] == 1 ) {
					if ( $time ) {
						$timep .= '1 ';
					}
					$timep .= 'minute';
				} else {
					$timep .= "{$hose['frame']['tm_min']} minutes";
				}
				$time[] = $timep;
			}
			
			if ( $hose['frame']['tm_sec'] ) {
				$timep = '';
				if ( $hose['frame']['tm_sec'] == 1 ) {
					if ( $time ) {
						$timep .= '1 ';
					}
					$timep .= 'seconds';
				} else {
					$timep .= "{$hose['frame']['tm_sec']} seconds";
				}
				$time[] = $timep;
			}
			
			$last = array_pop($time);
			$time = $time ? implode(', ', $time) . ' and ' . $last : $last . ' from ' . date("Y-m-d H:i:s", $hose['start']);
			
			$t['title']		= $title . $time;
			
			$t['values']	= json_encode($hose['data']['charts']);
			
			$t['id']		= "{$hose['host']}-{$hose['service']}-$key";
			
			$t['start']		= $hose['start'];
			$t['end']		= $hose['end'];
			
			require '../actions/plot.php';
		}
	} ?>
</body>
</html>
