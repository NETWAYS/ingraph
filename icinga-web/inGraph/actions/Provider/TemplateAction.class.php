<?php
// TODO(el): Caching.
class inGraph_Provider_TemplateAction extends inGraphBaseAction {
    protected $host;
    protected $plots;
    
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        try {
            $this->plots = $api->getPlots(
                ($this->host = $rd->getParameter('host')),
                ($service = $rd->getParameter('service', '')));
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        $template = $this->context->getModel(
            'Template', 'inGraph',
             AgaviConfig::get('modules.ingraph.templates'))->getTemplate(
                $service);
        if(array_key_exists('series', $template)) {
            $this->compileSeries($template['series']);
        }
//        if(array_key_exists('panels', $template)) {
//            foreach($template['panels'] as $panel) {
//                if(array_key_exists('series', $panel)) {
//                    $this->compileSeries($panel['series']);
//                }
//            }
//        }
        unset($template['re']);
        $this->setAttribute('template', $template);
        return $this->getDefaultViewName();
    }
    
    protected function compileSeries(&$series) {
        $compiled = array();
        foreach($series as $item) {
            foreach($this->plots as $plot) {
                // TODO(el): Validate that re exists
                // and is properly esacped?
                if(preg_match($item['re'], $plot['plot'])) {
                    if(!array_key_exists('type', $item)) {
                        $item['type'] = 'avg';
                    } elseif(is_array($item['type'])) {
                        foreach($item['type'] as $type) {
                            $compiled[] = array_merge(
                                $item, array(
                                    'host' => $this->host,
                                    'service' => $plot['service'],
                                    'plot' => $plot['plot'],
                                    'type' => $type
                                ));
                        }
                    } else {
                        $compiled[] = array_merge(
                            $item, array(
                                'host' => $this->host,
                                'service' => $plot['service'],
                                'plot' => $plot['plot'],
                            ));
                    }
                }
            }
        }
        $series = $compiled;
    }
    
    public function executeRead(AgaviRequestDataHolder $rd) {
        return $this->executeWrite($rd);
    }
}