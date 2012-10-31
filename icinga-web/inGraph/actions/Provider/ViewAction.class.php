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

        if (!isset($content['panels']) || !is_array($content['panels'])) {
            return $this->setError(
                'Invalid configuration for key "panels", expteced array in ' .
                    $rd->getParameter('view') . '.json');
        }

        foreach ($content['panels'] as &$panel) {
            $compiled = array();

            if (!isset($panel['series']) || !is_array($panel['series'])) {
                return $this->setError(
                    'Invalid configuration for key "series", expteced array in ' .
                        $rd->getParameter('view') . '.json');
            }

            foreach ($panel['series'] as $seriesStub) {
                try {
                    $plots = $this->getPlots($seriesStub);
                } catch(inGraph_XmlRpc_Exception $e) {
                    return $this->setError($e->getMessage());
                }

                $series = $seriesStub;

                while ( ($matchedPlotIndex = $view->compileSingleSeries($series, $series['host'], $plots)) !== false) {
                    $compiled[] = $series;
                    unset($plots[$matchedPlotIndex]);
                    $series = $seriesStub;
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
        $parentService = isset($series['parentService']) ?
            $series['parentService'] : null;
        $key = $series['host'] . $parentService . $series['service'];

        if ( ! array_key_exists($key, $this->plots)) {
            $plots = $this->getBackend()->fetchPlots(
                $series['host'], $series['service'], $parentService);
        } else {
            $plots = $this->plots['key'];
        }

        return $plots;
    }
}