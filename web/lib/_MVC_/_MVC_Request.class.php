<?php

class _MVC_Request {
    
    protected $scope = null;
    
    protected $method = null;
    
    protected $url = null;
    
    protected $parameters = null;
    
    protected $urlParts = null;
    
    public function initialize($scope) {
        $this->scope = $scope;
        
        $this->method = getenv('REQUEST_METHOD');
        
        $this->url = array_keys($_GET);
        $this->url = array_shift($this->url);
        
        $this->parameters = new _MVC_ParameterHolder(array_merge(array_slice($_GET, 1), $_POST));
        
        $this->explodeUrl();
    }
    
    public function getUrl() {
    	return $this->url;
    }
    
    public function getParameters() {
    	return $this->parameters;
    }
    
    public function getMethod() {
    	return $this->method;
    }
    
    protected function explodeUrl() {
    	$urlparts = explode('/', trim($this->url, '/'));
    	
    	if(!$urlparts[0] || $urlparts[0] == 'index_php') {
    		array_shift($urlparts);
    	}

    	$this->urlParts = $urlparts;
    }
    
    public function getUrlParts() {
    	return $this->urlParts;
    }
    
}