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

class inGraph_Provider_ImgAction extends inGraphBaseAction
{
    public function executeRead(AgaviRequestDataHolder $rd)
    {
        $templaterd = new AgaviRequestDataHolder();
        $templaterd->setParameters(array(
            'host' => $rd->getParameter('host'),
            'parentService' => $rd->getParameter('parentService', null),
            'service' => $rd->getParameter('service', '') // Empty string for the host-graph
        ));
        $template = $this->container
            ->createExecutionContainer('inGraph', 'Provider.Template',
                                       $templaterd, 'json', 'write')
            ->execute()
            ->getContent();
        $template = json_decode($template, true);
        if (isset($template['errorMessage'])) {
            return $this->setError($template['errorMessage']);
        }
        $daemonConfig = AgaviConfig::get('modules.ingraph.daemon');
        $charts = $this->getBackend()->fetchValues(
            $template['query'],
            $rd->getParameter('start', null), $rd->getParameter('end', null),
            $rd->getParameter('interval', null),
            (int) $daemonConfig['nullTolerance']);
        $templateseries = array();
        foreach ($template['content']['series'] as $id => $series) {
            $templateseries[$series['plot_id']] = $series;
        }
        $chartsseries = array();
        foreach ($charts['charts'] as $id => $series) {
            $chartsseries[$series['plot_id']] = $series;
        }
        $data = inGraph_Templates_Template::apply($chartsseries,
                                                  $templateseries);
        $this->setAttribute('arguments', array(
            'data' => $data,
            'options' => $template['content']['flot']
        ));
        return $this->getDefaultViewName();
    }
}
