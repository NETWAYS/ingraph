<?php 

class XMLRPCError extends Exception {}
class XMLRPCClientError extends XMLRPCError {}

class XMLRPCClient {
	
	protected $user		= 'grapher';
	protected $password	= 'changeme';
	protected $address  = '127.0.0.1';
	protected $port		= 5000;
	
	protected $uri		= null;
	protected $uriFormat= 'http://%s:%s@%s:%u/';
	
	function __construct() {
		$this->uri		= sprintf($this->uriFormat, $this->user, $this->password, $this->address, $this->port);	
	}
	
	public function call( $method='', $params=array() ) {
		$response = null;
		
		if ( $method ) {
			$request = xmlrpc_encode_request( $method, $params );
			
			$ctx = stream_context_create( array ( 'http' => array(
				'method' => 'POST',
				'header' => 'Content-Type: text/xml',
				'content' => $request
			) ) );
			
			if ( ( $response = file_get_contents( $this->uri, false, $ctx ) ) === false ) {
				throw new XMLRPCClientError("Can't contact {$this->address}:{$this->port}.");
			}
			
			$response = xmlrpc_decode( $response );
			
			if ( xmlrpc_is_fault( $response ) ) {
				throw new XMLRPCClientError("XMLRPC response: $response[faultCode]: $response[faultString].");
			}
		}
		
		return $response;
	}
	
}

?>