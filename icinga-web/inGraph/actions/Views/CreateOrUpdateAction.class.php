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

class inGraph_Views_CreateOrUpdateAction extends inGraphBaseAction
{
    protected $credentials = array('icinga.user', 'ingraph.view.modify');

    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $config     = AgaviConfig::get('modules.ingraph.views');
        $fileInfo   = new SplFileInfo(
            sprintf(
                '%s/%s.json',
                rtrim($config['path'], '/'),
                basename($rd->getParameter('name'), '.json')
            )
        );
        $template = new inGraph_Template_Template($rd->getParameter('content'), $fileInfo);
        try {
            $template->save();
        } catch (inGraph_Exception $e) {
            return $this->setError($e->getMessage());
        }
        return $this->getDefaultViewName();
    }
}
