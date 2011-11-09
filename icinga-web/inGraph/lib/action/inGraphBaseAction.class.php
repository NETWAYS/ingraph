<?php

class inGraphBaseAction extends IcingaBaseAction {
    protected $requires_auth = true;
    protected $credentials = array('icinga.user');
    
    public function isSecure() {
        return $this->requires_auth;
    }
    
    public function getCredentials() {
        return $this->credentials;
    }
    
    public function getDefaultViewName() {
        return 'Success';
    }
    
    public function executeRead(AgaviRequestDataHolder $rd) {
        return $this->getDefaultViewName();
    }
    
    public function executeWrite(AgaviRequestDataHolder $rd) {
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