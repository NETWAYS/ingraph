<?php

class inGraph_Provider_TemplateAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $host = $rd->getParameter('host');
        $service = $rd->getParameter('service');

        try {
            $plots = $this->getBackend()->fetchPlots($host, $service);
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }

        $manager = new inGraph_Template_Manager(
            AgaviConfig::get('modules.ingraph.templates'));

        $template = $manager->fetchTemplate($service);
        $template->compile($host, $plots);

        $this->setAttribute('template', array(
            'name' => $template->getInfo()->getBasename(),
            'content' => $template->getContent(),
            'isDefault' => $manager->isDefault($template)
        ));

        return $this->getDefaultViewName();
    }
}
