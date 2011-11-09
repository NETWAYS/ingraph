<?php

class inGraph_Provider_ValuesAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        $values = $api->getValues(json_decode($rd->getParameter('query')),
                                  $rd->getParameter('start', null),
                                  $rd->getParameter('end', null));
        $this->setAttribute('values', $values);
        return $this->getDefaultViewName();
    }
}