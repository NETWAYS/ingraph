<?php

class Data_PlotsView extends XMLRPCView {
    
    public function getAjax($parameters) {
        $plots = $this->getParameter('plots');
        $template = $this->getParameter('template');
        
        $data = array();
        
        if(count($plots['charts'])) {
        	foreach($plots['charts'] as $chart) {
        		array_walk(&$chart['data'], array($this, 'ensureTypes'));
        		$chart['key'] = $chart['host'] . $chart['service'] . $chart['label'];
        		$chart['disabled'] = true;
        		
        		foreach($template['series'] as $seriesCfg) {
        			if(preg_match($seriesCfg['re'], $chart['label'])) {
        				$chart['disabled'] = false;
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
        	'start' => $parameters->get('start', null),
        	'end' => $parameters->get('end', null)
        ));
    }
    
}