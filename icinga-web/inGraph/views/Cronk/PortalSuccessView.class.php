<?php

class inGraph_Cronk_PortalSuccessView extends inGraphBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd) {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Cronk.Portal');
    }
}
