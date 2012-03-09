<?php

class inGraph_Provider_HostsAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $hosts = $this->getBackend()->fetchHosts(
                $rd->getParameter('host', '%'),
                $rd->getParameter('offset', 0),
                $rd->getParameter('limit', 20)
            );
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('hosts', $hosts);
        return $this->getDefaultViewName();
    }
}
