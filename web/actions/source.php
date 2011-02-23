<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$host			= get_post_parameter( 'host', false );

if ( ! $host ) {
	throw new Exception('source.php: Host missing.');
}

$service		= get_post_parameter( 'service', false, true );
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
		'start' => time() - ( 60 * 60 ),
		'end' => $et,
		'interval' => 60
	);
	$tf[] = array(
		'start' => time() - ( 1 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => 60 * 60
	);
	$tf[] = array(
		'start' => time() - ( 7 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => 24 * 60 * 60
	);
	$tf[] = array(
		'start' => time() - ( 31 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => 7 * 24 * 60 * 60
	
	);
	$tf[] = array(
		'start' => time() - ( 365 * 24 * 60 * 60 ),
		'end' => $et,
		'interval' => 31 * 24 * 60 * 60
	);
} else {
	if ( ! $i ) {
		$i = $xcli->call( 'getTimeFrames' );
		$i = array_values($i);
		$i = $i[$di]['interval'];
	}
	
	$tf[] = array(
		'start' => $st,
		'end' => $et,
		'interval' => $i
	);
}

$plots = $xcli->call( 'getPlots', array( $host ) );

foreach ( $plots as $plot ) {
	if ( ( ! $service || $service == $plot['service'] ) && ! in_array_array( $plot['service'], $data, 'service' ) ) {
		foreach ( $tf as $f ) {

			$values = $xcli->call( 'getPlotValues', array( $host, '', $service, '', $f['start'], $f['end'], intval( $f['interval'] ) ) );
			
			foreach ( $values['charts'] as &$chart ) {
				sort_values( $chart['values'] );
			}
			
			$e = aftime($f['end']);
			$s = aftime($f['start']);
			$r = array();
			foreach ($e as $k => $v) {
				$r[$k] = $v - $s[$k];
			}
			
			$data[] = array(
				'host'		=> $host,
				'service'	=> $plot['service'],
				'frame'		=> $r,
				'data'		=> $values,
				'start'		=> $f['start'],
				'end'		=> $f['end']
			);
		}
	}
}

?>