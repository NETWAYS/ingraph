<?php 

class inGraph_XMLRPCErrorView extends IcingainGraphBaseView {
    
    public function executeJson() {
    	return json_encode(array(
    		'success' => false,
    		'results' => array(),
    		'message' => $this->getAttribute('exception')->getMessage()
    	));
    }
    
}