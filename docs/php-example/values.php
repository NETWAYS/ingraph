<?php

$et = time() - 24*3600 * 10;// * 10.8;
$st = time() - 24*3600 * 40;
$dt = ($et - $st) / 1000;

$host = $_GET['host'];
$parent_service = $_GET['parent_service'];
$service = $_GET['service'];
$plot = $_GET['plot'];

$request = xmlrpc_encode_request("getPlotValues", array($host, $parent_service, $service, $plot, $st, $et, $dt));
$context = stream_context_create(array('http' => array(
	'method' => "POST",
	'header' => "Content-Type: text/xml",
	'content' => $request
)));
$file = file_get_contents("http://grapher:changeme@127.0.0.1:5000/", false, $context);
$response = xmlrpc_decode($file);
if ($response && xmlrpc_is_fault($response)) {
	trigger_error("xmlrpc: $response[faultString] ($response[faultCode])");
} else {
	echo "var data = [\n";
	
	foreach (array('upper_limit', 'max', 'avg', 'min', 'lower_limit') as $type) {
		echo <<<PREP
		{
			label: "$type",
			data: [
PREP;

		ksort($response);
		$last_v = null;
		foreach ($response as $key => $val) {
			$ts = (int)$key;
			$ts += 3600; // adjust for GMT+1, hooray for flot's timezone support...
			$ts *= 1000; // javascript wants milliseconds
			if (isset($val[$type])) {
				$v = $val[$type];
			} else {
				$v = 'null';
			}
			
			if ($last_v == 'null' && $v == 'null') {
				continue;
			}
			
			$last_v = $v;
			
			echo "[ {$ts}, {$v} ],\n";
		}
		
		echo <<<POST
			]
		},
POST;
	}

	echo "];\n\n";
}
?>