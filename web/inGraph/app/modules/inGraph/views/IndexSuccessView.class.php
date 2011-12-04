<?php

class inGraph_IndexSuccessView extends inGraphBaseView {
    public function executeHtml(AgaviRequestDataHolder $rd) {
        $this->setupHtml($rd);
        $this->setAttributes($rd->getParameters());
    }
}