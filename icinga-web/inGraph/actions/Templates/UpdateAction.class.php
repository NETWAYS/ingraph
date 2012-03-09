<?php

class inGraph_Templates_UpdateAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $manager = new inGraph_Template_Manager(
            AgaviConfig::get('modules.ingraph.templates'));

        $template = $manager->fetchTemplateByFileName($rd->getParameter('name'));

        $content = json_decode($rd->getParameter('content'), true);

        $template->update($content);

        try {
            $template->save();
        } catch (inGraph_Exception $e) {
            return $this->setError($e->getMessage());
        }

        return $this->getDefaultViewName();
    }
}
