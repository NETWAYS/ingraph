<?php

require 'source.php';

$flot = array(
	'series' => array(),
	'success' => true,
	'update' => false,
	'time'	=> time(),
	'options' => new stdClass(),
	'start' => $st,
	'end' => $et
);

$dir = '../pub/templates/';
$h = opendir($dir);
$templates = array();
while(($file = readdir($h)) !== false) {
	if($file == 'default.json') {
		continue;
	}
	$file = $dir . $file;
	
	if(!@is_file($file)) {
		continue;
	}
	
	$templates[] = json_decode(@file_get_contents($file), true);
}
$templates[] = json_decode(@file_get_contents($dir . 'default.json'), true);
closedir($h);

foreach($data as $host => $services) {
	foreach($services as $service => $series) {
		foreach($templates as $template) {
			if(preg_match($template['re'], $service)) {
				$flot['options'] = $template['flot'];
				
				$fseries = array();
				
				foreach($series as $seriesi) {
					
					$key = sprintf('%s-%s-%s', $host, $service, $seriesi['label']);
					
					$match = false;
					
					foreach($template['series'] as $tseries) {
						
						if(preg_match($tseries['re'], $seriesi['label'])) {
							if(!in_array($key, $fseries)) {
								$fseries[$key] = array(
									'data' => $seriesi['data'],
									'label' => $tseries['label'] ? $tseries['label'] : $seriesi['label'],
									'unit' => $tseries['unit'] ? $tseries['unit'] : $seriesi['unit'],
									'xaxis' => $tseries['xaxis'] ? $tseries['xaxis'] : 1,
									'yaxis' => $tseries['yaxis'] ? $tseries['yaxis'] : 1,
									'color' => $tseries['color'] ? $tseries['color'] : null,
									'series' => $tseries['series'] ? $tseries['series'] : new stdClass(),
									'lines' => $tseries['lines'] ? $tseries['lines'] : new stdClass(),
									'id' => $tseries['id'] ? $tseries['id'] : null,
									'fillBetween' => $tseries['fillBetween'] ? $tseries['fillBetween'] : null,
									'disabled' =>  false
								);
							} else {
								array_merge(&$fseries[$key], $tseries);
							}
							
							$match = true;
							
							break;
						}
					}
					if(!$match) {
						$fseries[$key] = array(
							'data' => $seriesi['data'],
							'label' => $seriesi['label'],
							'unit' => $seriesi['unit'],
							'xaxis' => 1,
							'yaxis' => 1,
							'color' => null,
							'disabled' =>  true
						);						
					}
				}
				
				$series = $fseries;
				
				break;
			}
		}
		
		$flot['series'] = array_values($series);
	}
}

$flot['total'] = count($flot['series']);

echo json_encode($flot);

?>