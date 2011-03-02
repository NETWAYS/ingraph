<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$host			= get_post_parameter( 'host', false );

if ( ! $host ) {
	throw new Exception('source.php: Host missing.');
}

$service		= get_post_parameter( 'service', '', true );
$parent_service	= get_post_parameter( 'parent_service', false, true );
$start			= get_post_parameter( 'offset', 0, true );
$limit			= get_post_parameter( 'limit', 10, true );
$st				= get_post_parameter( 'start', false, true, 'strtotime' );
$et				= get_post_parameter( 'end', time(), true, 'strtotime');
$i				= get_post_parameter( 'interval', false, true );
$di				= 0;
$tf				= array();
$data			= array();

$xcli			= new XMLRPCClient();

if ( ! $st ) {
	// default
	$tf[] = array(
		'start' => '',
		'end' => '',
		'interval' => '',
		'context' => true
	);
	$tf[] = array(
		'start' => time() - ( 60 * 60 ),
		'end' => $et,
		'interval' => ''
	);
	$tf[] = array(
		'start' => time() - ( 1 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => ''
	);
	$tf[] = array(
		'start' => time() - ( 7 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => ''
	);
	$tf[] = array(
		'start' => time() - ( 31 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => ''
	
	);
	$tf[] = array(
		'start' => time() - ( 365 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => ''
	);
} else {
	$tf[] = array(
		'start' => $st,
		'end' => $et,
		'interval' => $i
	);
}

foreach ( $tf as $tkey => $f ) {
	
	$plots = $xcli->call( 'getPlotValues', array( $host, $service, $f['start'] ? intval( $f['start'] ) : '', $f['end'] ? intval( $f['end'] ) : '', $f['interval'] ? intval( $f['interval'] ) : '' ) );
	
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
			
			if ( ! array_key_exists( $tkey, $data[$chart['host']][$chart['service']] ) ) {
				$data[$chart['host']][$chart['service']][$tkey] = array(
					'data' => array(),
					'start' => $chart['values'][0]['x'],
					'end' => $chart['values'][count( $chart['values'] ) - 1]['x'],
					'context' => isset( $f['context'] ) ? $f['context'] : false			
				);
			}
			
			$data[$chart['host']][$chart['service']][$tkey]['data'][] = array(
				'label' => $chart['label'],
				'unit' => $chart['unit'],
				'values' => $chart['values']
			);
		}
	}
}

?>