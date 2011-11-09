<?php

class inGraph_Provider_HostsAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $icingaapi = $this->getContext()->getModel(
        	'Store.LegacyLayer.IcingaApi', 'Api');
        
        $search = $icingaapi->createSearch();
        $search->setSearchTarget(IcingaApiConstants::TARGET_HOST);
        $search->setResultType(IcingaApiConstants::RESULT_ARRAY);
        $search->setResultColumns(array('HOST_NAME'));
        
        IcingaPrincipalTargetTool::applyApiSecurityPrincipals($search);
        
        $permittedHosts = $icingaapi->fetch()->getAll();
        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedHosts));
        $permittedHosts = iterator_to_array($i, false);
    	
        $ingraphapi = $this->getApi();
        try {
            $availableHosts = $ingraphapi->getHosts(
                $rd->getParameter('host', '%'));
		} catch(XMLRPCClientException $e) {
		    $this->setError($e->getMessage());
		}
		
		$finalHosts = array_intersect($permittedHosts,
		    $availableHosts['hosts']);
		$total = count($finalHosts);
		$finalHosts = array_slice($finalHosts,
		                          $rd->getParameter('offset', 0),
		                          $rd->getParameter('limit', 10));
		$this->setAttribute('hosts', array(
		    'total' => $total,
		    'hosts' => $finalHosts
		));
        return $this->getDefaultViewName();
    }
}