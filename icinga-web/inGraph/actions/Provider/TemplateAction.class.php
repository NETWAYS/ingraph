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

class inGraph_Provider_TemplateAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $host = $rd->getParameter('host');
        $service = $rd->getParameter('service');

        try {
            $plots = $this->getBackend()->fetchPlots(
                $host, $service, $rd->getParameter('parentService', null));
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        
        // TODO(el): Throw exception in case we did not find any plots?
        // if (!$plots) { ... }

        $manager = new inGraph_Template_Manager(
            AgaviConfig::get('modules.ingraph.templates'));

        $template = $manager->fetchTemplate($service);
        $template->compile($host, $plots);

        $this->setAttribute('template', array(
            'name' => $template->getInfo()->getBasename(),
            'content' => $template->getContent(),
            'isDefault' => $manager->isDefault($template)
        ));

        return $this->getDefaultViewName();
    }
}
