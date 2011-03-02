<?php

require_once '../lib/inGraph/functions.php';
require_once '../lib/inGraph/XMLRPCClient.class.php';

$xcli		= new XMLRPCClient();

$query		= get_post_parameter( 'query', '.*', true );
$offset		= get_post_parameter( 'offset', 0 );
$limit		= get_post_parameter( 'limit', 10 );

$intervals	= $xcli->call( 'getTimeFrames' ) ;

$intervals	= filter_array( $intervals, 'interval', "/{$query}/" );

echo json_encode( array(
	'results' => array_slice( $intervals, $offset, $limit ),
	'total' => count($intervals) 
) );

?>