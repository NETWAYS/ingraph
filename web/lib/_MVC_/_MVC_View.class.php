<?php 

class _MVC_View {
	
	protected $scope = null;
	
	protected $bottle = null;
	
	public function initialize($bottle) {
		$this->bottle = $bottle;
		
		$this->scope = $bottle->getScope();
	}
	
	public function getAjax($parameters) {
		
	}
	
	public function getHtml($parameters) {
		
	}
	
	public function errorAjax($paramers) {
		
	}
	
	public function errorHtml($parameters) {
		
	}
	
	public function setParameter($key, $value, $overwrite=true) {
		$this->bottle->setParameter($key, $value, $overwrite);
	}
	
	public function getParameter($key, $default=null) {
		return $this->bottle->getParameter($key, $default);
	}
	
}