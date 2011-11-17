<?php
// TODO(el): Caching.
class inGraph_Provider_TemplateAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        try {
            $plots = $api->getPlots(($host = $rd->getParameter('host')),
                                    ($service = $rd->getParameter('service')));
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        $template = $this->context->getModel(
            'Template', 'inGraph',
             AgaviConfig::get('modules.ingraph.templates'))->getTemplate(
                $service);
        if(array_key_exists('series', $template)) {
            $compiled = array();
            foreach($template['series'] as $series) {
                foreach($plots as $plot) {
                    // TODO(el): Validate that re exists
                    // and is properly esacped?
                    if(preg_match($series['re'], $plot['plot'])) {
                        $compiled[] = array_merge(
                            $series, array(
                                'host' => $host,
                                'service' => $plot['service'],
                                'plot' => $plot['plot'],
                            ));
                    }
                }
            }
            $template['series'] = $compiled;
        }
        unset($template['re']);
        $this->setAttribute('template', $template);
        return $this->getDefaultViewName();
    }
}