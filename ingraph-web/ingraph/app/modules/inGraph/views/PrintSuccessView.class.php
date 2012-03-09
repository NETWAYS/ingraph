<?php

class inGraph_PrintSuccessView extends inGraphBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd) {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Print');

        $this->setAttributes($rd->getParameters());
    }
}
