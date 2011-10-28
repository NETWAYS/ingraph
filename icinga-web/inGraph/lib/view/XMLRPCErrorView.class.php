<?php 

class inGraph_XMLRPCErrorView extends IcingainGraphBaseView {
    public function executeJson() {
        $this->getContainer()->getResponse()->setHttpStatusCode(500);
    	return json_encode(array(
    		'success' => false,
    		'results' => array(),
    		'errorMessage' => $this->getAttribute('message')
    	));
    }
}