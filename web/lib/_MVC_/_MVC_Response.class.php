<?php 

class _MVC_Response {
	
	protected $scope = null;
	
	protected $output = null;
	
	protected $http11 = array(
		'101' => 'Switching Protocols',
		'200' => 'OK',
		'201' => 'Created',
		'202' => 'Accepted',
		'203' => 'Non-Authoritative Information',
		'204' => 'No Content',
		'205' => 'Reset Content',
		'206' => 'Partial Content',
		'300' => 'Multiple Choices',
		'301' => 'Moved Permanently',
		'302' => 'Found',
		'303' => 'See Other',
		'304' => 'Not Modified',
		'305' => 'Use Proxy',
		'307' => 'Temporary Redirect',
		'400' => 'Bad Request',
		'401' => 'Unauthorized',
		'402' => 'Payment Required',
		'403' => 'Forbidden',
		'404' => 'Not Found',
		'405' => 'Method Not Allowed',
		'406' => 'Not Acceptable',
		'407' => 'Proxy Authentication Required',
		'408' => 'Request Time-out',
		'409' => 'Conflict',
		'410' => 'Gone',
		'411' => 'Length Required',
		'412' => 'Precondition Failed',
		'413' => 'Request Entity Too Large',
		'414' => 'Request-URI Too Large',
		'415' => 'Unsupported Media Type',
		'416' => 'Requested range not satisfiable',
		'417' => 'Expectation Failed',
		'500' => 'Internal Server Error',
		'501' => 'Not Implemented',
		'502' => 'Bad Gateway',
		'503' => 'Service Unavailable',
		'504' => 'Gateway Time-out',
		'505' => 'HTTP Version not supported'
	);
	
	protected $headers = array();
	
	protected $status = 200;
	
	public function initialize($scope) {
		$this->scope = $scope;
	}
	
	public function execute() {
		$this->sendHeaders();
		
		echo $this->output;
	}
	
	public function setOutput($output) {
		$this->output = $output;
	}
	
	public function getOutput() {
		return $this->output;
	}
	
	public function setStatus($status) {
		$this->status = $status;
		
		return $this;
	}
	
	public function setHeader($key, $value, $overwrite=true) {
		if(!in_array($key, $this->header) || $overwrite) {
			$this->headers[$key] = $value;
		}
	}
	
	public function sendHeaders() {
		header(sprintf('HTTP/1.1 %u %s', $this->status, $this->http11[$this->status]));
		
		foreach($this->headers as $key => $value) {
			header(sprintf('%s: %s', $key, $value));
		}
	}
}