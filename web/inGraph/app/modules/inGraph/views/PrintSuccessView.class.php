<?php

class inGraph_PrintSuccessView extends inGraphBaseView {
    public function executeHtml(AgaviRequestDataHolder $rd) {
        $this->setupHtml($rd);
        $this->setAttributes($rd->getParameters());
    }
}