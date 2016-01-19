<?php
/*
 * Copyright (C) 2013 NETWAYS GmbH, http://netways.de
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
    private $plots = array(); // Plots cache

    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $manager = new inGraph_Template_Manager(AgaviConfig::get('modules.ingraph.views'));
        $manager->collectTemplates();
        $view       = $manager->fetchTemplateByFileName($rd->getParameter('view'));
        $content    = $view->getContent();
        if (! isset($content['panels']) || ! is_array($content['panels'])) {
            return $this->setError(
                'Invalid configuration for key "panels", expteced array in '
                . $view->getSplFileInfo()->getRealPath()
            );
        }
        $backend = $this->getBackend()->getBackend();
        foreach ($content['panels'] as &$panel) {
            if (! isset($panel['series']) || ! is_array($panel['series'])) {
                return $this->setError(
                    'Invalid configuration for key "series", expected array in '
                    . $view->getSplFileInfo()->getRealPath()
                );
            }
            foreach ($panel['series'] as /* $i => */ &$series) {
                if (isset($series['target'])) {
                    $series['plot_id'] = md5($series['target']);
                    continue;
                }
                try {
                    $plots = $this->getPlots($series);
                } catch(inGraph_XmlRpc_Exception $e) {
                    return $this->setError($e->getMessage());
                }
                $valid = false;
                foreach ($plots['plots'] as $plot) {
                    $re = $series['re'];
                    if ($backend->getName() === 'graphite') {
                        /** @var inGraph_Backend_Graphite $backend */
                        $re = '/' . $backend->escape(trim($re, '/')) . '/';
                    }
                    if ($view->matches($re, $plot['plot'])) {
                        if (is_array($series['type'])) {
                            $type = $series['type'][0];
                        } else {
                            $type = $series['type'];
                        }
                        $plot['plot_id'] .= ' - ' . $type;
                        $series = array_merge($series, $plot);
                        $valid = true;
                        break;
                    }
                }
                if (! $valid) {
                    $series = null;
                }
//                unset($panel['series'][$i]);
            }
            $panel['series'] = array_filter($panel['series']);
        }
        $this->setAttribute(
            'view',
            array(
                'name'      => $view->getSplFileInfo()->getBasename(),
                'content'   => $content
            )
        );
        return $this->getDefaultViewName();
    }

    private function getPlots($series)
    {
        $parentService = isset($series['parentService']) ? $series['parentService'] : null;
        $key = $series['host'] . $parentService . $series['service'];
        if (! isset($this->plots[$key])) {
            $this->plots[$key] = $this->getBackend()->fetchPlots(
                $series['host'], $series['service'], $parentService, null, 0, null // Force no limit
            );
        }
        return $this->plots[$key];
    }
}
