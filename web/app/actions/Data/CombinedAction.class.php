<?php 

class Data_CombinedAction extends XMLRPCAction {
    
	public function executePost($parameters) {
		parent::executePost($parameters);
        
		$config = json_decode($parameters->get('config'), true);
		$this->setParameter('config', $config);
		
		$start = $parameters->get('start', '');
		$end = $parameters->get('end');
		
		$mp = array();
		
		foreach($config['data'] as $dataCfg) {
			$mp[] = array(
				$dataCfg['host'],
				$dataCfg['service'],
				$start,
				$end,
				array_key_exists('interval', $dataCfg) ? $dataCfg['interval'] : ''
			);
		}
		
		try {
	        $this->setParameter('plots', $this->getClient()->callMultiple(
	            'getPlotValues',
	        	$mp
	        ));
		} catch(XMLRPCClientError $e) {
			$this->setParameter('exception', $e);
			return false;
		}
	}

}