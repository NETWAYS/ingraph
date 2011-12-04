<?php

class inGraph_Provider_HostsAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        try {
            $hosts = $api->getHosts(
                $rd->getParameter('host', '%'),
                $rd->getParameter('limit', 10),
                $rd->getParameter('offset', 0));
		} catch(XMLRPCClientException $e) {
		    return $this->setError($e->getMessage());
		}
		$this->setAttribute('hosts', array(
		    'total' => $hosts['total'],
		    'results' => $hosts['hosts']
	    ));
        return $this->getDefaultViewName();
    }
}