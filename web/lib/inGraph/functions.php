<?php

function filter ( $input, $pattern ) {
	sort( $input, SORT_STRING );
	
	if ( ! $pattern ) {
		return $input;
	}
	
	$filter = array();
	
	foreach ( $input as $item ) {
		if ( preg_match( $pattern, $item ) ) {
			$filter[] = array( $item );
		}
	}

	return $filter;
}

function filter_array ( $input, $field, $pattern ) {
	if ( ! $pattern ) {
		return $input;
	}
	
	$filter = array();
	
	foreach ( $input as $item ) {
		if ( preg_match( $pattern, $item[$field] ) ) {
			$filter[] = $item;
		}
	}

	return $filter;	
}

function get_post_parameter ( $name, $default='', $force=false, $callback=null ) {
	$parameter = isset( $_POST[$name] ) ? $_POST[$name] : $default;
	if ( $parameter && $callback) {
		if ( ( $callback == 'strtotime' ) && ( 1 !== preg_match( '/^[1-9][0-9]*$/', $parameter ) ) ) {
			$parameter = call_user_func($callback, $parameter);
		}
	} elseif ( ! $parameter && $force ) {
		$parameter = $default;
	}	
	return $parameter;
}

function aftime( $tstamp, $format='%Y %m %d %H %M %S' ) {
	return strptime( strftime( $format, $tstamp ), $format );
}

function in_array_array( $needle='', $haystack=array(), $field=0 ) {
	$in_array = false;
	
	foreach ( $haystack as $item ) {
		if 	( $item[$field] == $needle ) {
			$in_array = true;
			break;
		}
	}
	
	return $in_array;
}

function _cmp ( $a, $b ) {
	return ( $a['x'] == $b['x'] ) ? 0 : ( ($a['x'] < $b['x']) ? -1 : 1 );
}

function sort_values( &$values ) {
	usort( $values, '_cmp' );
}

?>