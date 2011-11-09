<?php

class inGraphBaseAction extends IcingaBaseAction {
    protected $requires_auth = true;
    protected $credentials = array('icinga.user');
    protected static $api = null;
    
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
    
    public function setError($err) {
        $this->setAttribute('errorMessage', $err);
        return 'Error';
    }
    
    public function handleError(AgaviRequestDataHolder $rd) {
        $m = $this->getAttribute('errorMessage', false);
        if($m === false) {
            $m = array();
            foreach($this->container->getValidationManager()
                    ->getErrorMessages() as $e) {
                $m[] = $e['message'];
            }
            $m = implode(' ', $m);
        }
        $this->setAttribute('errorMessage', $m);
        return 'Error';
    }
    
    public function getApi() {
        if(self::$api == null) {
            self::$api = $this->getContext()->getModel(
                'Api', 'inGraph', AgaviConfig::get('modules.ingraph.xmlrpc'));
        }
        return self::$api;
    }
}