<?php

class inGraph_Provider_HostsAction extends inGraph_XMLRPCAction {
    public function executeWrite(AgaviParameterHolder $rd) {
        $api = $this->getContext()->getModel('Store.LegacyLayer.IcingaApi',
            'Api');
        $search = $api->createSearch()
        ->setSearchTarget(IcingaApiConstants::TARGET_HOST)
        ->setResultType(IcingaApiConstants::RESULT_ARRAY)
        ->setResultColumns(array('HOST_NAME'));
        $permittedHosts = $api->fetch()->getAll();
        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedHosts));
        $permittedHosts = iterator_to_array($i, false);
    	try {
			$availableHosts = $this->getClient()->call(
				'getHostsFiltered',
				array($rd->getParameter('host', '%'))
			);
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
		} catch(XMLRPCClientException $e) {
			$this->setAttribute('message', $e->getMessage());
			return 'Error';
		}
		
        return $this->getDefaultViewName();
    }
}