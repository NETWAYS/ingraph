<?php

class inGraph_Templates_EditAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $template = $this->context->getModel(
            'Template', 'inGraph',
             AgaviConfig::get('modules.ingraph.templates'));
        $template->save($rd->getParameter('name'),
                        $rd->getParameter('content'));
        return $this->getDefaultViewName();
    }
}