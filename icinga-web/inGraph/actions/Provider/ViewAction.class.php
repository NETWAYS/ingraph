<?php
// TODO(el): Caching.
class inGraph_Provider_ViewAction extends inGraphBaseAction {
    protected $plots = array();
    
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $view = $this->context->getModel('View', 'inGraph',
            AgaviConfig::get('modules.ingraph.views'))->getView(
                $rd->getParameter('view'));
        foreach($view['panels'] as &$panel) {
            $compiled = array();
            foreach($panel['series'] as $series) {
                if(!array_key_exists('host', $series) &&
                   !array_key_exists('service', $series) &&
                   !array_key_exists('re', $series) &&
                   !array_key_exists('type', $series)) {
                    // TODO(el): Do not ignore silently
                    continue;
                }
                $plots = $this->getPlots($series);
                if(!is_array($plots)) {
                    return 'Error';
                }
                foreach($plots as $plot) {
                    if(preg_match($series['re'], $plot['plot'])) {
                        $compiled[] = array_merge(
                            $series, array(
                                'host' => $series['host'],
                                'service' => $series['service'],
                                'plot' => $plot['plot'],
                            ));
                    }
                }
            }
            $panel['series'] = $compiled;
        }
        $this->setAttribute('template', $view);
        return $this->getDefaultViewName();
    }
    
    protected function getPlots($series) {
        $key = $series['host'] . $series['service'];
        if(!array_key_exists($key, $this->plots)) {
            try {
                $plots = $this->getApi()->getPlots($series['host'], $series['service']);
            } catch(XMLRPCClientException $e) {
                return $this->setError($e->getMessage());
            }
        } else {
            $plots = $this->plots['key'];
        }
        return $plots;
    }
}