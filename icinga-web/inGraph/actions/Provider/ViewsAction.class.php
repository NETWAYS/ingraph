<?php

class inGraph_Provider_ViewsAction extends IcingainGraphBaseAction {
	
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
    
    public function executeWrite(AgaviParameterHolder $rd) {
        $params = AgaviConfig::get('modules.ingraph.views');
        
        $views = $this->context->getModel('View', 'inGraph', $params);
        
        $this->setAttribute('views', $views->getViews());
        
        return $this->getDefaultViewName();
    }
    
    public function handleError(AgaviRequestDataHolder $rd) {
        return 'Error';
    }
    
}