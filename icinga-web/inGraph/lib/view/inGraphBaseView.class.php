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
}