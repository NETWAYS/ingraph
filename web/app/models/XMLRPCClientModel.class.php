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
			$ch = curl_init();
			
			curl_setopt_array($ch, array(
				CURLOPT_URL => $this->uri,
				CURLOPT_POSTFIELDS => $this->encode_request($method, $params),
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 240
			));
			
			if(($response = curl_exec($ch)) === false) {
				curl_close($ch);
				throw new XMLRPCClientError(sprintf('cURL: %s.', curl_error($ch)));
			}
			
			curl_close($ch);
			
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
					CURLOPT_TIMEOUT => 240
				));
				
				curl_multi_add_handle($mh, $ch);
				
				$handles[] = $ch;
			}

			$running = null;
			do {
				curl_multi_exec($mh, $running);
				$ready = curl_multi_select($mh);
				if($ready > 0) {
				    $info = curl_multi_info_read($mh);
				    if (false !== $info && $info['result'] !== CURLE_OK) {
				    	throw new XMLRPCClientError(sprintf('cURL: %s.', curl_error($info['handle'])));
				    }
				}
			} while($running > 0 && $ready != -1);

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
			throw new XMLRPCClientError('XMLRPC response: Unabled to read, expected array: ' . $response);
		}
		if(xmlrpc_is_fault($dr)) {
			throw new XMLRPCClientError("XMLRPC response: ${dr['faultCode']}: ${dr['faultString']}.");
		}
		
		return $dr;
	}
	
}
