<?php

class inGraph_Provider_ServicesAction extends inGraph_XMLRPCAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $host = $rd->getParameter('host');
        $service = $rd->getParameter('service', '%');
        $api = $this->getContext()->getModel('Store.LegacyLayer.IcingaApi',
            'Api');
        $search = $api->createSearch()
        ->setSearchTarget(IcingaApiConstants::TARGET_SERVICE)
        ->setSearchFilter('SERVICE_NAME', $service,
                          IcingaApiConstants::MATCH_LIKE)
        ->setSearchFilter('HOST_NAME', $host)
        ->setResultType(IcingaApiConstants::RESULT_ARRAY)
        ->setResultColumns(array('SERVICE_NAME'));
        IcingaPrincipalTargetTool::applyApiSecurityPrincipals($search);
        $permittedServices = $api->fetch()->getAll();
        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedServices));
        $permittedServices = iterator_to_array($i, false);
    	try {
			$availableServices = $this->getClient()->call(
				'getServices',
				array($host,
				      $rd->getParameter('service', '%'))
			);
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