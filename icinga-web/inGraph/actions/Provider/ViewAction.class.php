<?php

class inGraph_Provider_ViewAction extends inGraphBaseAction
{
    protected $plots = array(); // Plots cache

    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $manager = new inGraph_View_Manager(
            AgaviConfig::get('modules.ingraph.views'));

        $view = $manager->fetchView($rd->getParameter('view'));
        $content = $view->getContent();

        foreach ($content['panels'] as &$panel) {
            $compiled = array();

            foreach ($panel['series'] as $series) {
                try {
                    $plots = $this->getPlots($series);
                } catch(inGraph_XmlRpc_Exception $e) {
                    return $this->setError($e->getMessage());
                }

                $match = $view->compileSingleSeries(
                    $series, $series['host'], $plots);

                if ($match) {
                    $compiled[] = $series;
                }
            }

            $panel['series'] = $compiled;
        }

        $this->setAttribute('view', array(
            'name' => $view->getInfo()->getBasename(),
            'content' => $content
        ));

        return $this->getDefaultViewName();
    }

    protected function getPlots($series)
    {
        $key = $series['host'] . $series['service'];

        if ( ! array_key_exists($key, $this->plots)) {
            $plots = $this->getBackend()->fetchPlots($series['host'],
                                                     $series['service']);
        } else {
            $plots = $this->plots['key'];
        }

        return $plots;
    }
}