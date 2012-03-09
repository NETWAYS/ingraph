<?php

class inGraph_IndexSuccessView extends inGraphBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd) {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Index');

        $this->setAttributes($rd->getParameters());
    }
}
