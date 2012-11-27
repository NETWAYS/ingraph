<?php

class inGraph_Provider_TemplateAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $host = $rd->getParameter('host');
        $service = $rd->getParameter('service');

        try {
            $plots = $this->getBackend()->fetchPlots(
                $host, $service, $rd->getParameter('parentService', null));
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        
        // TODO(el): Throw exception in case we did not find any plots?
        // if (!$plots['total']) { ... }
        $manager = new inGraph_Template_Manager(
            AgaviConfig::get('modules.ingraph.templates'));

        $template = $manager->fetchTemplate($service);
        $template->compile($host, $plots['plots']);

        $this->setAttribute('template', array(
            'name' => $template->getInfo()->getBasename(),
            'content' => $template->getContent(),
            'isDefault' => $manager->isDefault($template)
        ));

        return $this->getDefaultViewName();
    }
}
