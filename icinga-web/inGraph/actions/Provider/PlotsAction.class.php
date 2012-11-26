<?php

class inGraph_Provider_PlotsAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $plots = $this->getBackend()->fetchPlots(
                $rd->getParameter('host', '%'),
                $rd->getParameter('service', ''),
                $rd->getParameter('parentService', null),
                $rd->getParameter('plot', null),
                $rd->getParameter('start', 0),
                $rd->getParameter('limit', 20)
            );
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('plots', $plots);
        return $this->getDefaultViewName();
    }
}
