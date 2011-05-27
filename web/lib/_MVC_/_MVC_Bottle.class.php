<?php

class _MVC_Bottle {

	protected $scope = null;

	protected $action = null;

	protected $view = null;

	protected $template = null;

	protected $parameters = array();

	protected $method = null;

	protected $outputType = null;

	public function initialize($scope, $action, $view, $template) {
		$this->scope = $scope;
		$this->action = $action;
		$this->view = $view;
		$this->template = $template;

		return $this;
	}

	protected function getInstance($dir, $class) {
		if(!class_exists($class, false)) {
			$path = $dir . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, explode('_', $class)) . '.class.php';

			if(is_readable($path)) {
				require $path;
			} else {
				throw new _MVC_Exception();
			}
		}

		return new $class();
	}

	public function execute() {
		try {
			$action = $this->getInstance(_MVC_Config::get('actions_dir'), $this->action);
		} catch(Exception $e) {
			$this->scope->getResponse()->setStatus(404)->sendHeaders();
			_MVC_Exception::render($e);
		}
		$action->initialize($this);
		if(!$this->method) {
			$this->method = $this->scope->getRequest()->getMethod();
		}
		$method = 'execute' . _MVC_Util::ucfirstr($this->method);
		$success = $action->$method($this->scope->getRequest()->getParameters());

		$view = $this->getInstance(_MVC_Config::get('views_dir'), $this->view);
		$view->initialize($this);
		if(!$this->outputType) {
			if(isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
				$this->outputType = 'Ajax';
			} else {
				$this->outputType = 'Html';
			}			
		}
		$method = ($success !== false ? 'get' : 'error') . _MVC_Util::ucfirstr($this->outputType);
		if($output = $view->$method($this->scope->getRequest()->getParameters())) {
			$this->scope->getResponse()->setOutput($output);
		} else {
			$this->scope->getResponse()->setOutput($this->render());
		}

		return $this;
	}

	public function render() {
		${'t'} =& $this->parameters;

		ob_start();
		include _MVC_Config::get('templates_dir') . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, explode('_', $this->template)) . '.php';
		$content = ob_get_contents();
		ob_end_clean();

		ob_start();
		include _MVC_Config::get('templates_dir') . DIRECTORY_SEPARATOR . 'Master.php';
		$output = ob_get_contents();
		ob_end_clean();

		return $output;
	}

	public function getScope() {
		return $this->scope;
	}

	public function getContent() {
		return $this->scope->getResponse()->getOutput();
	}

	public function setParameter($key, $value, $overwrite=true) {
		if(!array_key_exists($key, $this->parameters) || $overwrite) {
			$this->parameters[$key] = $value;
		}
	}

	public function getParameter($key, $default=null) {
		return array_key_exists($key, $this->parameters) ? $this->parameters[$key] : $default;
	}

	public function setParameters($parameters) {
		$this->parameters = $parameters;
	}

	public function setMethod($method) {
		$this->method = $method;
	}

	public function setOutputType($outputType) {
		$this->outputType = $outputType;
	}

}