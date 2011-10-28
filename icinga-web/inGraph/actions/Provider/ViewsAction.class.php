<?php

class inGraph_Provider_ViewsAction extends IcingainGraphBaseAction {
    public function executeWrite(AgaviParameterHolder $rd) {
        $views = $this->context->getModel('View', 'inGraph',
            AgaviConfig::get('modules.ingraph.views'));
        $this->setAttribute('views', $views->getViews());
        return $this->getDefaultViewName();
    }
}