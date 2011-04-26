<?php

require 'source.php';

$flot = array(
	'series' => array(),
	'success' => true,
	'update' => false,
	'time'	=> time()*1000,
	'options' => array(),
	'start' => $st*1000,
	'end' => $et*1000
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
					foreach($template['series'] as $tseries) {
						if(preg_match($tseries['re'], $seriesi['label'])) {
							$fseries[] = array(
								'data' => $seriesi['data'],
								'label' => $tseries['label'] ? $tseries['label'] : $seriesi['label'],
								'unit' => $tseries['unit'] ? $tseries['unit'] : $seriesi['unit'],
								'xaxis' => $tseries['xaxis'] ? $tseries['xaxis'] : 1,
								'yaxis' => $tseries['yaxis'] ? $tseries['yaxis'] : 1,
								'color' => $tseries['color'] ? $tseries['color'] : null,
								'disabled' =>  false
							);
						} else {
							$fseries[] = array(
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
				}
				
				$series = $fseries;
				
				break;
			}
		}
		
		$flot['series'] = $series;
	}
}

$flot['total'] = count($flot['series']);

echo json_encode($flot);

?>