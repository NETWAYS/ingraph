<?php

class XMLRPCAction extends _MVC_Action {
	
	public function executePost($parameters) {
	    foreach(array('start', 'end', 'interval') as $parameter) {
        	$parameters->set($parameter, $this->strtoint($parameters->get($parameter, '')));	
        }
	}
	
    private function strtoint($str) {
    	if(is_numeric($str)) {
    		return intval($str);
    	}
    	
    	return $str;
    }
	
	public function getClient() {
		return $this->scope->getModel('XMLRPCClient', array(
			'user' => _MVC_Config::get('xmlrpc.user'),
			'password' => _MVC_Config::get('xmlrpc.password'),
			'address' => _MVC_Config::get('xmlrpc.address'),
			'port' => _MVC_Config::get('xmlrpc.port'),
		));
	}
	
}