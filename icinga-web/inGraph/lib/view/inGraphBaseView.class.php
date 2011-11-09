<?php

class inGraphBaseView extends IcingaBaseView {
    public function executeJson(AgaviRequestDataHolder $rd) {
        $this->getContainer()->getResponse()->setHttpStatusCode(500);
    	return json_encode(array(
    		'success' => false,
    		'results' => array(),
    		'errorMessage' => $this->getAttribute('message')
    	));
    }
}