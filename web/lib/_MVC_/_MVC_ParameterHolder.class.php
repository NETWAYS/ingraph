<?php

class _MVC_ParameterHolder {
	
	protected $parameters = array();
	
	public function __construct(array $parameters=array()) {
		$this->parameters = $parameters;	
	}
	
	public function get($key, $default=null) {
		$val = array_key_exists($key, $this->parameters) ? $this->parameters[$key] : $default;
		if(is_int($val)) {
			$val = intval($val);
		}
		return $val;
	}
	
	public function set($key, $value, $overwrite=true) {
		if(!in_array($key, $this->parameters) || $overwrite) {
			$this->parameters[$key] = $value;
		}
	}
	
}