<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$host			= get_post_parameter( 'host', false );

if ( ! $host ) {
	throw new Exception( 'source.php: Host missing.' );
}

$service		= get_post_parameter( 'service', '', true );
$st				= get_post_parameter( 'start', '', true, 'strtotime' );
$et				= get_post_parameter( 'end', time(), true, 'strtotime');
$i				= get_post_parameter( 'interval', '', true );
$di				= 0;
$tf				= array();
$data			= array();

$xcli			= new XMLRPCClient();

$hosts			= $xcli->call( 'getHostsFiltered' , array( $host, 2, 0 ) );

if ( $hosts['total'] > 1 && ! $st ) {
	$st = strtotime( '-1 day' );
}

$services		= $xcli->call( 'getServices' , array( $host, $service, 2, 0 ) ) ;

if ( $services['total'] > 1 && ! $st ) {
	$st = strtotime( '-1 day' );
}

$plots = $xcli->call( 'getPlotValues', array( $host, $service, $st ? intval($st) : $st, $et ? intval($et) : $et, $i ? intval($i) : $i ) );

foreach ( $plots as $plot ) {
	if ( ! $plot ) {
		continue;
	}
	
	foreach ( $plot as &$chart ) {
		if ( ! $chart['values'] ) {
			continue;
		}
		
		sort_values( $chart['values'] );
		
		if ( ! array_key_exists( $chart['host'], $data ) ) {
			$data[$chart['host']] = array();
		}
		
		if ( ! array_key_exists( $chart['service'], $data[$chart['host']] ) ) {
			$data[$chart['host']][$chart['service']] = array();
		}
		
		$xy = array();
		foreach($chart['values'] as $xyo) {
			$xy[] = array($xyo['x']*1000, $xyo['y']);
		}
		
		$data[$chart['host']][$chart['service']][] = array(
			'label' => $chart['label'],
			'unit' => $chart['unit'],
			'data' => $xy,
			'start' => $chart['values'][0]['x'],
			'end' => $chart['values'][count( $chart['values'] ) - 1]['x']
		);
	}
}

?>