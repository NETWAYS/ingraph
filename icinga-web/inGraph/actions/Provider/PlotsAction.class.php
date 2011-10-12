<?php

class inGraph_Provider_PlotsAction extends inGraph_XMLRPCAction {
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
	        $this->setAttribute('plots', $this->getClient()->call(
	            'getPlotValues',
	            array(
	                $rd->getParameter('host', '%'),
	                $service = $rd->getParameter('service'),
	                $rd->getParameter('start', ''),
	                $rd->getParameter('end', ''),
	                $rd->getParameter('interval', ''),
	                $rd->getParameter(
	                	'nullTolerance',
	                	AgaviConfig::get('modules.ingraph.daemon.nullTolerance', 0)
	                )
	            )
	        ));
    	} catch(XMLRPCClientException $e) {
			$this->setAttribute('exception', $e);
			return 'Error';
		}

    	$this->setAttribute(
    		'template',
    		$this->context->getModel(
    			'Template',
    			'inGraph',
    			AgaviConfig::get('modules.ingraph.templates')
    		)->getTemplate(
    			$service
    		)
    	);
    	
    	return $this->getDefaultViewName();
    }
    
    public function handleError(AgaviRequestDataHolder $rd) {
        return 'Error';
    }
}