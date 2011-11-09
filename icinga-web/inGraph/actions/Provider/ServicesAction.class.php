<?php

class inGraph_Provider_ServicesAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $host = $rd->getParameter('host');
        $service = $rd->getParameter('service', '%');
        
        $icingaapi = $this->getContext()->getModel(
            'Store.LegacyLayer.IcingaApi','Api');
        
        $search = $icingaapi->createSearch();
        $search->setSearchTarget(IcingaApiConstants::TARGET_SERVICE);
        $search->setSearchFilter(
            'SERVICE_NAME', $service, IcingaApiConstants::MATCH_LIKE);
        $search->setSearchFilter('HOST_NAME', $host);
        $search->setResultType(IcingaApiConstants::RESULT_ARRAY);
        $search->setResultColumns(array('SERVICE_NAME'));
        
        IcingaPrincipalTargetTool::applyApiSecurityPrincipals($search);
        
        $permittedServices = $icingaapi->fetch()->getAll();
        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedServices));
        $permittedServices = iterator_to_array($i, false);
    	
        $ingraphapi = $this->getApi();
        try {
            $availableServices = $ingraphapi->getServices($host, $service);
		} catch(XMLRPCClientException $e) {
			$this->setAttribute('exception', $e);
			return 'Error';
		}
		$finalServices = array_intersect($permittedServices,
		    $availableServices['services']);
		$total = count($finalServices);
		$finalServices = array_slice($finalServices,
                            		 $rd->getParameter('offset', 0),
                            		 $rd->getParameter('limit', 10));
		$this->setAttribute('services', array(
		    'total' => $total,
		    'services' => $finalServices
		));
		return $this->getDefaultViewName();
    }
}