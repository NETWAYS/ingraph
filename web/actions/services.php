<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$xcli	= new XMLRPCClient();

$host	= get_post_parameter( 'host', false );
$query	= get_post_parameter( 'service', '%', true );
$offset	= get_post_parameter( 'offset', 0 );
$limit	= get_post_parameter( 'limit', 10 );

$services = $xcli->call( 'getServices' , array( $host, $query, $limit, $offset ) ) ;

echo json_encode( array(
	'results' => array_map( arrayfy, $services['services'], array_fill( 0, count( $services['services'] ), 'service' ) ),
	'total' => $services['total'] 
) );

?>