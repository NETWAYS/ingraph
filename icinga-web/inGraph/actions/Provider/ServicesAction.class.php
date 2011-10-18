<?php

class inGraph_Provider_ServicesAction extends inGraph_XMLRPCAction {
    public function executeWrite(AgaviParameterHolder $rd) {
        $api = $this->getContext()->getModel('Store.LegacyLayer.IcingaApi',
            'Api');
        $search = $api->createSearch()
        ->setSearchTarget(IcingaApiConstants::TARGET_SERVICE)
        ->setResultType(IcingaApiConstants::RESULT_ARRAY)
        ->setResultColumns(array('SERVICE_NAME'));
        $permittedServices = $api->fetch()->getAll();
        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedServices));
        $permittedServices = iterator_to_array($i, false);
    	try {
			$availableServices = $this->getClient()->call(
				'getServices',
				array(
					$rd->getParameter('host'),
					$rd->getParameter('service', '%'),
					$rd->getParameter('limit', 10),
					$rd->getParameter('offset', 0)
				)
			);
			$finalServices = array_intersect($permittedServices,
			    $availableServices['services']);
			$this->setAttribute('services', array(
			    'total' => count($finalServices),
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