<?php 

class Data_CombinedAction extends XMLRPCAction {
    
	public function executePost($parameters) {
		parent::executePost($parameters);
        
		$config = json_decode($parameters->get('config'), true);
		$this->setParameter('config', $config);
		
		$start = $parameters->get('start', '');
		$end = $parameters->get('end', '');
		$interval = $parameters->get('interval', '');
		$nullTolerance = (int)($parameters->get('nullTolerance', _MVC_Config::get('daemon.nullTolerance', 0));
		
		$mp = array();
		
		foreach($config['data'] as $dataCfg) {
			$mp[] = array(
				$dataCfg['host'],
				$dataCfg['service'],
				$start,
				$end,
				$interval,
				$nullTolerance
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