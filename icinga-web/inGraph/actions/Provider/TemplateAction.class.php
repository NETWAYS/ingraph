<?php
// TODO(el): Caching.
class inGraph_Provider_TemplateAction extends inGraphBaseAction {
    public function executeWrite(AgaviParameterHolder $rd) {
        $api = $this->getContext()->getModel(
            'Api', 'inGraph', AgaviConfig::get('modules.ingraph.xmlrpc'));
        $plots = $api->getPlots(($host = $rd->getParameter('host')),
	                            ($service = $rd->getParameter('service')));
	    $template = $this->context->getModel(
	        'Template', 'inGraph',
	         AgaviConfig::get('modules.ingraph.templates'))->getTemplate(
                $service);
        if(array_key_exists('series', $template)) {
            foreach($template['series'] as &$series) {
                foreach($plots as $plot) {
                    // TODO(el): Validate that re exists
                    // and is properly esacped?
                    if(preg_match($series['re'], $plot)) {
                        unset($series['re']);
                        $series['plot'] = $plot;
                        break;
                    }
                }
            }
        }
        unset($template['re']);
        return $this->getDefaultViewName();
    }
    
    public function executeRead(AgaviParameterHolder $rd) {
        return $this->executeWrite($rd);
    }
}