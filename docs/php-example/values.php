<?php

$et = time() - 24*3600 * 7;// * 10.8;
$st = time() - 24*3600 * 10;
$dt = ($et - $st) / 300;

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
		foreach ($response as $key => $val) {
			$ts = (int)$key * 1000;
			if (isset($val[$type])) {
				$v = $val[$type];
			} else {
				$v = 'null';
			}

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