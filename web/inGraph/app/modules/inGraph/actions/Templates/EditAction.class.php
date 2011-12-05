<?php

class inGraph_Templates_EditAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $template = $this->context->getModel(
            'Template', 'inGraph',
             AgaviConfig::get('modules.ingraph.templates'));
        $ret = $template->save($rd->getParameter('name'),
                               $rd->getParameter('content'));
        if($ret !== true) {
            return $this->setError($ret);
        }
        return $this->getDefaultViewName();
    }
}