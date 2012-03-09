<?php

class Default_LoginInputView extends IcingaDefaultBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd)
    {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Login');
    }
}

