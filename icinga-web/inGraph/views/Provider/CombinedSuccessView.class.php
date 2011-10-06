<?php

class inGraph_Provider_CombinedSuccessView extends inGraph_XMLRPCSuccessView {
	
	public function executeJson(AgaviRequestDataHolder $rd) {
        $plots = $this->getAttribute('plots');
        $config = $this->getAttribute('config');
        
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
	                array_walk($chart['data'], array($this, 'ensureTypes'));
	                $chart['key'] = $chart['host'] . $chart['service'] . $chart['label'];
                	$data[] = $chart;
                }
            }
        }
        
        return json_encode(array(
            'results' => $data,
            'total' => count($data),
        	'options' => array_diff_key($config, array_fill_keys(array('data'), null)),
            'start' => $rd->getParameter('start', null),
            'end' => $rd->getParameter('end', null)
        ));
	}
	
}