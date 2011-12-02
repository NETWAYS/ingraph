<?php
// TODO(el): Caching.
class inGraph_Provider_PlotsAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        try {
            $plots = $api->getPlots($rd->getParameter('host'),
                                    $rd->getParameter('service', ''));
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('plots', $plots);
        return $this->getDefaultViewName();
    }
}