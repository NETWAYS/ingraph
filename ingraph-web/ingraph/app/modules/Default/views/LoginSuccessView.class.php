<?php

class Default_LoginSuccessView extends IcingaDefaultBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd)
    {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Login');
    }
}

