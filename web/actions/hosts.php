<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$xcli	= new XMLRPCClient();

$query	= get_post_parameter( 'query', '%', true );
$offset	= get_post_parameter( 'offset', 0 );
$limit	= get_post_parameter( 'limit', 10 );

$hosts = $xcli->call( 'getHostsFiltered' , array( $query, $limit, $offset ) ) ;

echo json_encode( array(
	'results' => array_map( create_function( '$item', 'return array( $item );' ), $hosts['hosts'] ),
	'total' => $hosts['total'] 
) );

?>