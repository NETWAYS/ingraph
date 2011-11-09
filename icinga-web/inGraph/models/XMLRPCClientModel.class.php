<?php 

class inGraph_XMLRPCClientModel extends AppKitBaseModel implements AgaviISingletonModel {
	
	protected $uriFormat = 'http://%s:%s@%s:%u/';
	
	public function initialize(AgaviContext $ctx, array $params = array()) {
		parent::initialize($ctx, $params);
		
		$this->setParameter('uri', sprintf(
			$this->uriFormat,
			$this->getParameter('user'),
			$this->getParameter('pass'),
			$this->getParameter('host'),
			$this->getParameter('port')
		));
	}
	
	public function call($method='', $params=array()) {
		$response = null;

		if ($method) {
			$ch = curl_init();
			
			curl_setopt_array($ch, array(
				CURLOPT_URL => $this->getParameter('uri'),
				CURLOPT_POSTFIELDS => $this->encode_request($method, $params),
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => $this->getParameter('timeout', 30),
				CURLOPT_PROXY => '',
				CURLOPT_HTTPHEADER => array('Expect:')
			));
			
			$response = curl_exec($ch);
			
			if($response === false || curl_getinfo($ch, CURLINFO_HTTP_CODE) != 200) {
				$e = $response === false ? curl_error($ch) : $response;
				curl_close($ch);
				throw new XMLRPCClientException(sprintf('cURL: %s.', $e));
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
					CURLOPT_URL => $this->getParameter('uri'),
					CURLOPT_POSTFIELDS => $this->encode_request($method, $params),
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_TIMEOUT => $this->getParameter('timeout', 30),
				    CURLOPT_PROXY => ''
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
				    	throw new XMLRPCClientException(sprintf('cURL: %s.', curl_error($info['handle'])));
				    }
				}
			} while($running > 0 && $ready != -1);

			foreach($handles as $ch) {			
				$response = array_merge_recursive($response, $this->decode_response(curl_multi_getcontent($ch)));
				curl_close($ch);
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
			throw new XMLRPCClientException('XMLRPC response: Unabled to read, expected array: ' . $response);
		}
		if(xmlrpc_is_fault($dr)) {
			throw new XMLRPCClientException("XMLRPC response: ${dr['faultCode']}: ${dr['faultString']}.");
		}
		
		return $dr;
	}
	
}