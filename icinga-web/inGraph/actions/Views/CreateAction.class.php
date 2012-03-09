<?php

class inGraph_Views_CreateAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $manager = new inGraph_View_Manager(
            AgaviConfig::get('modules.ingraph.views'));

        $view = $manager->create($rd->getParameter('name'));

        $content = json_decode($rd->getParameter('content'), true);

        $view->update($content);

        try {
            $view->save();
        } catch (inGraph_Exception $e) {
            return $this->setError($e->getMessage());
        }

        return $this->getDefaultViewName();
    }
}
