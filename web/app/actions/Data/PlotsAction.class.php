<?php 

class Data_PlotsAction extends XMLRPCAction {
    
    public function executePost($parameters) {
    	parent::executePost($parameters);
        
    	try {
	        $this->setParameter('plots', $this->getClient()->call(
	            'getPlotValues',
	            array(
	                $parameters->get('host', '%'),
	                $parameters->get('service'),
	                $parameters->get('start', ''),
	                $parameters->get('end', ''),
	                $parameters->get('interval', ''),
	                (int)$parameters->get('nullTolerance', _MVC_Config::get('daemon.nullTolerance', 0))
	            )
	        ));
    	} catch(XMLRPCClientError $e) {
			$this->setParameter('exception', $e);
			return false;
		}

        $this->setParameter('template',
        	$this->scope->getController()->createBottle('Template_Service',
        		array('service' => $parameters->get('service')),
        		'post',
        		'php'
        	)->execute()->getContent()
        );
    }
    
}