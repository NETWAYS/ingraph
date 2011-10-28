<?php

class IcingainGraphBaseAction extends IcingaBaseAction {
    public function isSecure() {
        return true;
    }
    
    public function getCredentials() {
        return array ('icinga.user');
    }
    
    public function getDefaultViewName() {
        return 'Success';
    }
    
    public function executeRead(AgaviParameterHolder $rd) {
        return $this->getDefaultViewName();
    }
    
    public function handleError(AgaviRequestDataHolder $rd) {
        $m = $this->getAttribute('message', false);
        if($m === false) {
            $m = array();
            foreach($this->container->getValidationManager()
                    ->getErrorMessages() as $e) {
                $m[] = $e['message'];
            }
            $m = implode(' ', $m);
        }
        $this->setAttribute('message', $m);
        return 'Error';
    }
}