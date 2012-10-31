<?php

class inGraph_Provider_PlotsAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $plots = $this->getBackend()->fetchPlots(
                $rd->getParameter('host'),
                // Empty string as service represents host graph
                $rd->getParameter('service', ''),
                $rd->getParameter('parentService', null)
            );
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('plots', $plots);
        return $this->getDefaultViewName();
    }
}
