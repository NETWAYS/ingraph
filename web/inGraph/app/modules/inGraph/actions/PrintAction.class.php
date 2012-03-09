<?php

class inGraph_PrintAction extends inGraphBaseAction {
    public function executeRead(AgaviRequestDataHolder $rd) {
        return $this->getDefaultViewName();
    }
}