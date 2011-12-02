<?php

class inGraph_Provider_ViewsAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $views = $this->context->getModel('View', 'inGraph',
            AgaviConfig::get('modules.ingraph.views'))->getViews();
        $this->setAttribute('views', array(
		    'total' => count($views),
		    'results' => $views
		));
        return $this->getDefaultViewName();
    }
}