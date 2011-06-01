<?php

class Data_CombinedView extends XMLRPCView {
    
    public function getAjax($parameters) {
        $plots = $this->getParameter('plots');
        $config = $this->getParameter('config');
        
        $data = array();
        
        if(count($plots['charts'])) {
            foreach($plots['charts'] as $chart) {
                $chart['disabled'] = true;

                foreach($config['data'] as $dataCfg) {
                	if($dataCfg['host'] == $chart['host'] && $dataCfg['service'] == $chart['service']) {
                		foreach($dataCfg['series'] as $seriesCfg) {
                			if(preg_match($seriesCfg['re'], $chart['label'])) {
		        				$chart['disabled'] = false;
		        				$chart = array_merge($chart, array_diff_key($seriesCfg, array_fill_keys(array('re'), null)));
                			}
                		}              		
                	}
                }
                
                if(!$chart['disabled']) {
	                array_walk(&$chart['data'], array($this, 'ensureTypes'));
	                unset($chart['values']);
	                $chart['key'] = $chart['host'] . $chart['service'] . $chart['label'];
                	$data[] = $chart;
                }
            }
        }
        
        return json_encode(array(
            'results' => $data,
            'total' => count($data),
        	'options' => array_diff_key($config, array_fill_keys(array('panels'), null)),
            'start' => $parameters->get('start', null),
            'end' => $parameters->get('end', null)
        ));
    }
    
}
