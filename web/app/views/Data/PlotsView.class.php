<?php

class Data_PlotsView extends _MVC_View {
    
    public function getAjax($parameters) {
        $plots = $this->getParameter('plots');
        $template = $this->getParameter('template');
        
        $data = array();
        
        if(count($plots['charts'])) {
        	foreach($plots['charts'] as $chart) {
        		usort($chart['values'], array($this, 'sortX'));
        		$chart['data'] = array_map(array($this, 'ensureTypes'), $chart['values']);
        		unset($chart['values']);
        		$chart['key'] = $chart['host'] . $chart['service'] . $chart['label'];
        		$chart['disabled'] = true;
        		
        		foreach($template['series'] as $options) {
        			if(preg_match($options['re'], $chart['label'])) {
        				$chart['disabled'] = false;
        				$chart = array_merge($chart, array_diff_key($options, array_fill_keys(array('re'), null)));
        			}
        		}
        		
        		$data[] = $chart;
        	}
        }
        
        return json_encode(array(
        	'series' => $data,
        	'total' => count($data),
        	'options' => array_diff_key($template, array_fill_keys(array('re', 'series'), null)),
        	'start' => $parameters->get('start', null),
        	'end' => $parameters->get('end', null)
        ));
    }
    
    private function ensureTypes($xy) {
    	return array(intval($xy["x"])*1000, floatval($xy["y"]));
    }
    
    private function sortX($a, $b) {
    	return ($a["x"] == $b["x"]) ? 0 : (($a["x"] < $b["x"]) ? -1 : 1);
    }
    
}