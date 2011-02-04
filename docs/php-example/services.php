<?php

if (!isset($_GET['host'])) {
$request = xmlrpc_encode_request("getHosts", array());
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
		sort($response);
		
		foreach ($response as $host) {
			echo <<<HTML
<p><a href="services.php?host={$host}">
	{$host}
</a></p>
HTML;
		}
	}
} else {
	$host = $_GET['host'];

	$request = xmlrpc_encode_request("getPlots", array($host));
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
		foreach ($response as $plot) {
			if (isset($plot['parent_service'])) {
				$parent_service = $plot['parent_service'];
			} else {
				$parent_service = '';
			}
			$service = $plot['service'];
			$plot = $plot['name'];
			
			echo <<<HTML
	<p><a href="test.php?host={$host}&parent_service={$parent_service}&service={$service}&plot={$plot}">
		{$host} -> {$parent_service} -> {$service} -> {$plot}
	</a></p>
HTML;
		}
	}
}

?>