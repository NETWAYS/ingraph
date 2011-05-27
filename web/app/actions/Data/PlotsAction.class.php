<?php 

class Data_PlotsAction extends XMLRPCAction {
    
    public function executePost($parameters) {
        foreach(array('start', 'end', 'interval') as $parameter) {
        	$parameters->set($parameter, $this->strtoint($parameters->get($parameter, '')));	
        }
        
        $this->setParameter('plots', $this->getClient()->call(
            'getPlotValues',
            array(
                $parameters->get('host', '%'),
                $parameters->get('service'),
                $parameters->get('start', ''),
                $parameters->get('end', ''),
                $parameters->get('interval', '')
            )
        ));

        $this->setParameter('template',
        	$this->scope->getController()->createBottle('Template_Service',
        		array('service' => $parameters->get('service')),
        		'post',
        		'php'
        	)->execute()->getContent()
        );
    }
    
    protected function strtoint($str) {
    	if(is_numeric($str)) {
    		return intval($str);
    	}
    	
    	return $str;
    }
    
}