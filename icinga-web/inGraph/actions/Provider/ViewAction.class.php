<?php
/*
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

class inGraph_Provider_ViewAction extends inGraphBaseAction
{
    protected $plots = array(); // Plots cache

    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $manager = new inGraph_Views_Manager(
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
                while (($matchedPlotIndex = $view->compileSingleSeries(
                            $series, $series['host'],
                            $plots['plots'])
                       ) !== false
                ) {
                    $compiled[] = $series;
                    unset($plots['plots'][$matchedPlotIndex]);
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
        if (!isset($this->plots[$key])) {
            $this->plots[$key] = $this->getBackend()->fetchPlots(
                $series['host'], $series['service'], $parentService);
        }
        return $this->plots[$key];
    }
}
