<?php

class inGraph_Provider_CombinedAction extends inGraph_XMLRPCAction {
	
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
        $config = json_decode($rd->getParameter('config'), true);
        $start = $rd->getParameter('start', '');
        $end = $rd->getParameter('end', '');
        $interval = $rd->getParameter('interval', '');
        $nullTolerance = $rd->getParameter('nullTolerance', AgaviConfig::get('modules.ingraph.daemon.nullTolerance', 0));
        
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
            $this->setAttribute('plots', $this->getClient()->callMultiple(
            	'getPlotValues',
                $mp
            ));
        } catch(XMLRPCClientError $e) {
			$this->setAttribute('exception', $e);
			return 'Error';
        }
        
        $this->setAttribute('config', $config);
    	
    	return $this->getDefaultViewName();
    }
    
    public function handleError(AgaviRequestDataHolder $rd) {
        return 'Error';
    }
    
}