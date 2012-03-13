<?php

class inGraph_Provider_ServicesAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $services = $this->getBackend()->fetchServices(
                $rd->getParameter('host'),
                $rd->getParameter('query', '%'),
                $rd->getParameter('offset', 0),
                $rd->getParameter('limit', 20)
            );
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('services', $services);
        return $this->getDefaultViewName();
    }
}
