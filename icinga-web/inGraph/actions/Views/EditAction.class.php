<?php

class inGraph_Views_EditAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $view = $this->context->getModel(
            'View', 'inGraph',
             AgaviConfig::get('modules.ingraph.views'));
        $ret = $view->save($rd->getParameter('name'),
                           $rd->getParameter('content'));
        if($ret !== true) {
            return $this->setError($ret);
        }
        return $this->getDefaultViewName();
    }
}