<?php 

class inGraph_XMLRPCClientModel extends inGraphBaseModel implements AgaviISingletonModel {
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
            if($response === false ||
               curl_getinfo($ch, CURLINFO_HTTP_CODE) != 200) {
                $e = $response === false ? curl_error($ch) : $response;
                curl_close($ch);
                throw new XMLRPCClientException('cURL: ' . $e);
            }
            curl_close($ch);
            $response = $this->decode_response($response);
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
            $dr = array($dr);
        }
        if(xmlrpc_is_fault($dr)) {
            throw new XMLRPCClientException(
                "XMLRPC response: ${dr['faultCode']}: ${dr['faultString']}");
        }
        return $dr;
    }
}
