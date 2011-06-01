<?php 

class _MVC_Action {
	
	protected $scope = null;
	
	protected $bottle = null;
	
	public function initialize($bottle) {
		$this->bottle = $bottle;
		
		$this->scope = $bottle->getScope();
	}
	
	public function executeGet($parameters) {
		
	}
	
	public function executePost($parameters) {
		
	}
	
	public function setParameter($key, $value, $overwrite=true) {
		$this->bottle->setParameter($key, $value, $overwrite);
	}
	
	public function getParameter($key, $default=null) {
		return $this->bottle->getParamter($key, $default);
	}
	
}