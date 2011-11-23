<?php

class inGraph_Provider_ValuesAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        // TODO(el): Check permissions for hosts / services.
        $api = $this->getApi();
        $start = $start = $rd->getParameter('start', null);
        $end = $rd->getParameter('end', time());
        if(($interval = $rd->getParameter('interval', null)) === null) {
            if($start !== null) {
                $interval = $this->siftInterval($start, $end);
            }
        }
        try {
            $values = $api->getValues(json_decode($rd->getParameter('query')),
                                      $rd->getParameter('start', null),
                                      $rd->getParameter('end', null),
                                      $interval);
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('values', $values);
        return $this->getDefaultViewName();
    }
    
    public function executeRead(AgaviRequestDataHolder $rd) {
        return $this->executeWrite($rd);
    }
}