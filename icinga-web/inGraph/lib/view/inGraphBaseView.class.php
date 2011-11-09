<?php

class inGraphBaseView extends IcingaBaseView {
    public function executeJson(AgaviRequestDataHolder $rd) {
        if(null !== ($err = $this->getAttribute('errorMessage', null))) {
            $this->getContainer()->getResponse()->setHttpStatusCode(500);
        	return json_encode(array(
        		'success' => false,
        		'results' => array(),
        		'errorMessage' => $err
        	));
        }
    }
    
    protected function json_encode($attr) {
        $attr = $this->getAttribute($attr);
	    foreach($attr['results'] as &$val) {
	        $val = array($val);
	    }
		return json_encode($attr);
    }
}