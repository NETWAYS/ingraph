<?php

class inGraph_Provider_ServicesAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        try {
            $services = $api->getServices($rd->getParameter('host'),
                                          $rd->getParameter('service', '%'),
                                          $rd->getParameter('limit', 10),
                                          $rd->getParameter('offset', 0));
		} catch(XMLRPCClientException $e) {
		    return $this->setError($e->getMessage());
		}
		$flat = array();
		foreach($services['services'] as $service) {
		    $flat[] = $service['service'];
		}
		$this->setAttribute('services', array(
		    'total' => count($flat),
		    'results' => $flat
		));
		return $this->getDefaultViewName();
    }
}