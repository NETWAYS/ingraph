<?php

class Default_IndexSuccessView extends IcingaDefaultBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd)
    {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Index');
    }
}

