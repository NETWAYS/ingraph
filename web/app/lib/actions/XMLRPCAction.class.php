<?php

class XMLRPCAction extends _MVC_Action {
	
	public function getClient() {
		return $this->scope->getModel('XMLRPCClient', array(
			'user' => _MVC_Config::get('xmlrpc.user'),
			'password' => _MVC_Config::get('xmlrpc.password'),
			'address' => _MVC_Config::get('xmlrpc.address'),
			'port' => _MVC_Config::get('xmlrpc.port'),
		));
	}
	
}