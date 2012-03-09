<?php

class inGraphBaseModel extends IcingaBaseModel
{
    protected $tm = null;

    public function initialize(AgaviContext $ctx, array $params = array())
    {
        parent::initialize($ctx, $params);
        $this->tm = $this->getContext()->getTranslationManager();
        $this->logger = $this->getContext()->getLoggerManager();
    }
}
