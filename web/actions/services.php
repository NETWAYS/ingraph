<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$xcli	= new XMLRPCClient();

$query	= get_post_parameter( 'query', false );
$host	= get_post_parameter( 'host', false );
$offset	= get_post_parameter( 'offset', 0 );
$limit	= get_post_parameter( 'limit', 10 );

$services = array();

if ( $host ) {
	$plots = $xcli->call( 'getPlots', array( $host ) );

	
	foreach ( $plots as $plot ) {
		if ( ! in_array_array( $plot['service'], $services, 'name' ) ) {
			$services[] = array( 'name' => $plot['service'], 'parent_service' => 0 );
		}
		
		if ( ( isset( $plot['parent_service'] ) && $plot['parent_service'] ) && ! in_array_array( $plot['parent_service'], $services, 'name' ) ) {
			$services[] = array( 'name' => $plot['parent_service'], 'parent_service' => 1 );
		}
	}
	
	$services = filter_array( $services, 'name', "/{$query}/" );
}
	
echo json_encode( array(
	'results' => array_slice( $services, $offset, $limit ),
	'total' => count( $services )
) );

?>