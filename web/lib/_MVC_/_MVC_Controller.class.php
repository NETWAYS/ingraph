<?php

class _MVC_Controller {
	
	protected $scope = null;
	
	public function initialize($scope) {
		$this->scope = $scope;
	}
	
	public function dispatch() {
		$this->createBottle()->execute();
		$this->scope->getResponse()->execute();
	}
	
	public function createBottle($base=null, $paramters=null, $method=null, $outputType=null) {
		$rq = $this->scope->getRequest();
		
		if(!$base) {
			$base = implode('_', array_map(array('_MVC_Util', 'ucfirstr'), $rq->getUrlParts()));
			if(!$base) {
				$base = 'Index';
			}
		}
		
		$template = $base;
		$view = $base . 'View';
		$action = $base . 'Action';
		
		$bottle = new _MVC_Bottle();
		$bottle->initialize($this->scope, $action, $view, $template);
		
		if($paramters) {
			$bottle->setParameters($paramters);
		}
		if($method) {
			$bottle->setMethod($method);
		}
		if($outputType) {
			$bottle->setOutputType($outputType);
		}

		return $bottle;
	}
	
}