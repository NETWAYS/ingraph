<?php

class inGraph_Provider_PlotsSuccessView extends inGraph_XMLRPCSuccessView {
	
	public function executeJson(AgaviRequestDataHolder $rd) {
        $plots = $this->getAttribute('plots');
        $template = $this->getAttribute('template');

        $data = array();
        
        if(count($plots['charts'])) {
        	foreach($plots['charts'] as $chart) {
        		array_walk($chart['data'], array($this, 'ensureTypes'));
        		$chart['key'] = $chart['host'] . $chart['service'] . $chart['label'];
        		
        		foreach($template['series'] as $seriesCfg) {
        			if(preg_match($seriesCfg['re'], $chart['label'])) {
        				$chart['enabled'] = true;
        				$chart = array_merge($chart, array_diff_key($seriesCfg, array_fill_keys(array('re'), null)));
        			}
        		}
        		
        		$data[] = $chart;
        	}
        }
        
        return json_encode(array(
        	'results' => $data,
        	'total' => count($data),
        	'options' => array_diff_key($template, array_fill_keys(array('re', 'series'), null)),
        	'start' => $rd->getParameter('start', $plots['min_timestamp']),
        	'end' => $rd->getParameter('end', $plots['max_timestamp']),
            'minTimestamp' => $plots['min_timestamp'],
            'maxTimestamp' => $plots['max_timestamp']
        ));
	}
	
}