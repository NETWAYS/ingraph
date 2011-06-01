<?php 

class XMLRPCClientModel extends _MVC_Model {
	
	protected $address = null;
	protected $port = null;
	
	protected $uri = null;
	protected $uriFormat = 'http://%s:%s@%s:%u/';
	
	protected $user = null;
	protected $password = null;
	
	public function __construct($user, $password, $address, $port) {
		$this->uri = sprintf($this->uriFormat, $user, $password, $address, $port);
		
		$this->address = $address;
		$this->port = $port;
		
		$this->user = $user;
		$this->password = $password;
	}
	
	public function call($method='', $params=array()) {
		$response = null;
		
		if ($method) {
			$request = $this->encode_request($method, $params);
			
			$ctx = stream_context_create(array('http' => array(
				'method' => 'POST',
				'header' => 'Content-Type: text/xml',
				'content' => $request
			)));
			
			if(($response = @file_get_contents($this->uri, false, $ctx)) === false) {
				throw new XMLRPCClientError("Can't contact {$this->address}:{$this->port}.");
			}
			
			$response = $this->decode_response($response);
		}
		
		return $response;
	}
	
	public function callMultiple($method='', $mparams=array()) {
		$response = null;
		
		if($method) {
			$handles = array();
			$mh = curl_multi_init();
			$response = array();
			
			foreach($mparams as $params) {
				$ch = curl_init();
				
				curl_setopt_array($ch, array(
					CURLOPT_URL => $this->uri,
					CURLOPT_POSTFIELDS => $this->encode_request($method, $params),
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_TIMEOUT => 120
				));
				
				curl_multi_add_handle($mh, $ch);
				
				$handles[] = $ch;
			}

			$running = $status = $e = null;
			do {
				$status = curl_multi_exec($mh, $running);
			    $info = curl_multi_info_read($mh);
			    if (false !== $info && $info['result'] !== CURLE_OK) {
			    	$e = sprintf('cURL: %s.', curl_error($info['handle']));
			    	//_MVC_Logger::warn($e);
			    }
			} while($status === CURLM_CALL_MULTI_PERFORM || $running);
			
			if($e) {
				throw new XMLRPCClientError($e);
			}

			foreach($handles as $ch) {			
				$response = array_merge_recursive($response, $this->decode_response(curl_multi_getcontent($ch)));
			}


			curl_multi_close($mh);
		}

		return $response;
	}
	
	protected function encode_request($method, $params) {
		return xmlrpc_encode_request($method, $params, array(
			'escape' => array('non-print', 'non-markup'),
			'encoding' => 'utf-8'
		));
	}
	
	protected function decode_response($response) {
		$dr = xmlrpc_decode($response, 'utf-8');
		if(!$dr) {
			$dr = iconv('ISO-8859-1', 'utf-8', $response);
			$dr = xmlrpc_decode($dr, 'utf-8');
		}
		
		if(!is_array($dr)) {
			throw new XMLRPCClientError('XMLRPC response: Unabled to read. Expected array.');
		}
		if(xmlrpc_is_fault($dr)) {
			throw new XMLRPCClientError("XMLRPC response: $dr[faultCode]: $dr[faultString].");
		}
		
		return $dr;
	}
	
}
