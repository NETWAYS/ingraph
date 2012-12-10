<?php

class inGraph_Provider_IntervalsAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $intervals = $this->getBackend()->fetchIntervals();
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('intervals', $intervals);
        return $this->getDefaultViewName();
    }
}
