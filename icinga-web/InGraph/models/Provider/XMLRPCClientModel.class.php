<?php

class InGraph_Provider_XMLRPCClientModel extends InGraphBaseModel implements AgaviISingletonModel {

	private $rpcUri = null;
	private $rpcUser = null;
	private $rpcPass = null;
	private $callUri = null;
	private $callReady = false;
	
	public function initialize(AgaviContext $context, array $parameters = array()) {
		parent::initialize($context, $parameters);
		
		$this->rpcUri = $parameters['uri'];
		$this->rpcUser = $parameters['user'];
		$this->rpcPass = $parameters['pass'];
		
		$this->callUri = $this->rpcUri;
		
		if ($this->rpcUser && $this->rpcPass) {
			$this->callUri = preg_replace('/^(https?:\/\/)/', sprintf('\\1%s:%s@', $this->rpcUser, $this->rpcPass), $this->callUri);
		}
		
		$this->callReady = true;
	}
	
	public function isReady() {
		return $this->callReady;
	}
	
	private function createContext($request) {
		return stream_context_create(array ('http' => array (
			'method' 	=> 'POST',
			'header'	=> 'Content-Type: text/xml',
			'content'	=> $request
		)));
	}
	
	public function callMethod($methodName, array $parameters = array ()) {
		$request = xmlrpc_encode_request($methodName, $parameters);
		
		$response = file_get_contents($this->callUri, false, $this->createContext($request));
		
		$response = xmlrpc_decode($response);
		
		if ( xmlrpc_is_fault( $response ) ) {
			throw new AgaviException('XMLRPC response is damaged!');
		}
		
		return $response;
	}
	
}

?>