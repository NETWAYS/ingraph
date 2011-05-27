<?php 

class XMLRPCClientModel extends _MVC_Model {
	
	protected $address = null;
	protected $port = null;
	
	protected $uri = null;
	protected $uriFormat = 'http://%s:%s@%s:%u/';
	
	public function __construct($user, $password, $address, $port) {
		$this->uri = sprintf($this->uriFormat, $user, $password, $address, $port);
		
		$this->address = $address;
		$this->port = $port;
	}
	
	public function call($method='', $params=array()) {
		$response = null;
		
		if ($method) {
			$request = xmlrpc_encode_request($method, $params);
			
			$ctx = stream_context_create(array('http' => array(
				'method' => 'POST',
				'header' => 'Content-Type: text/xml',
				'content' => $request
			)));
			
			if(($response = file_get_contents($this->uri, false, $ctx)) === false) {
				throw new XMLRPCClientError("Can't contact {$this->address}:{$this->port}.");
			}
			
			$response = xmlrpc_decode($response);
			
			if(xmlrpc_is_fault($response)) {
				throw new XMLRPCClientError("XMLRPC response: $response[faultCode]: $response[faultString].");
			}
		}
		
		return $response;
	}
}