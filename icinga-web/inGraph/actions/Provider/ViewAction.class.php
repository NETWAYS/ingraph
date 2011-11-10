<?php
// TODO(el): Caching.
class inGraph_Provider_ViewAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $api = $this->getApi();
        $view = $this->context->getModel('View', 'inGraph',
            AgaviConfig::get('modules.ingraph.views'))->getView(
                $rd->getParameter('view'));
        foreach($view['panels'] as &$panel) {
            $compiled = array();
            foreach($panel['data'] as &$data) {
                try {
                    $plots = $api->getPlots(($host = $data['host']),
            	                            ($service = $data['service']));
                } catch(XMLRPCClientException $e) {
		            return $this->setError($e->getMessage());
		        }
                foreach($data['series'] as $series) {
                    foreach($plots as $plot) {
                        // TODO(el): Validate that re exists
                        // and is properly esacped?
                        if(preg_match($series['re'], $plot)) {
                            $compiled[] = array_merge(
                                $series, array(
                                    'host' => $host,
                                    'service' => $service,
                                    'plot' => $plot,
                                ));
                        }
                    }
                }
            }
            unset($panel['data']);
            $panel['series'] = $compiled;
        }
        $this->setAttribute('template', $view);
        return $this->getDefaultViewName();
    }
}