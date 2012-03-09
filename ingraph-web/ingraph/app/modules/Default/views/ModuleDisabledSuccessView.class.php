<?php

class Default_ModuleDisabledSuccessView extends IcingaDefaultBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd)
    {
        $this->setAttribute('_title', 'Module Disabled');

        $this->setupHtml($rd);

        $this->getResponse()->setHttpStatusCode('503');
    }
}

