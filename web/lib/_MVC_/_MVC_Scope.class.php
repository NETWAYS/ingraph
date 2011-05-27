<?php

class _MVC_Scope {
	
	protected $controller = null;
	
	protected $request = null;
	
	protected $response = null;
	
	protected static $instance = null;
	
	public function initialize() {
		$this->controller = new _MVC_Controller();
		$this->controller->initialize($this);
		
		$this->request = new _MVC_Request();
		$this->request->initialize($this);
		
		$this->response = new _MVC_Response();
		$this->response->initialize($this);
	}
	
	public function getInstance() {
		if(self::$instance === null) {
			self::$instance = new _MVC_Scope();
			self::$instance->initialize();
		}
		return self::$instance;
	}
	
	public function getController() {	
		return $this->controller;
	}
	
	public function getRequest() {
		return $this->request;
	}
	
	public function getResponse() {
		return $this->response;
	}
	
	public function getModel($model, $parameters=null) {
		$model = "${model}Model";
		if($parameters === null) {
			$class = new $model();
		} else {
			$rc = new ReflectionClass($model);
			$class = $rc->newInstanceArgs($parameters);
		}
		$class->initialize($this);
		return $class;
	}
	
}