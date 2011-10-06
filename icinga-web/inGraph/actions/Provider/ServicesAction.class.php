<?php

class inGraph_Provider_ServicesAction extends inGraph_XMLRPCAction {
	
    public function isSecure() {
        return true;
    }
    
    public function getCredentials() {
        return array ('icinga.user');
    }
    
    public function getDefaultViewName() {
        return 'Success';
    }
    
    public function executeRead(AgaviParameterHolder $rd) {
        return $this->getDefaultViewName();
    }
    
    public function executeWrite(AgaviParameterHolder $rd) {
    	try {
			$this->setAttribute('services', $this->getClient()->call(
				'getServices',
				array(
					$rd->getParameter('host'),
					$rd->getParameter('service', '%'),
					$rd->getParameter('limit', 10),
					$rd->getParameter('offset', 0)
				)
			));
		} catch(XMLRPCClientException $e) {
			$this->setAttribute('exception', $e);
			return 'Error';
		}
		
		return $this->getDefaultViewName();
    }
    
    public function handleError(AgaviRequestDataHolder $rd) {
        return 'Error';
    }
    
}