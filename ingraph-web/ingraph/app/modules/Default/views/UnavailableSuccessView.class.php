<?php

class Default_UnavailableSuccessView extends IcingaDefaultBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd)
    {
        $this->setAttribute('_title', 'Application Unavailable');

        $this->setupHtml($rd);

        $this->getResponse()->setHttpStatusCode('503');
    }
}

