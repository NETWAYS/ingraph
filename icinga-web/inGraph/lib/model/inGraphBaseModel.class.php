<?php

class inGraphBaseModel extends AppKitBaseModel {
    protected $tm = null;
    
    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        $this->tm = $this->getContext()->getTranslationManager();
    }
}