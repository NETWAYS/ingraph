<?php

class inGraph_Provider_ValuesAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        // TODO(el): Check permissions for hosts / services.
        $api = $this->getApi();
        try {
            $values = $api->getValues(json_decode($rd->getParameter('query')),
                                      $rd->getParameter('start', null),
                                      $rd->getParameter('end', null));
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('values', $values);
        return $this->getDefaultViewName();
    }
}