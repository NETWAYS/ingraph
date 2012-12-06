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

class inGraph_Provider_HostsAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $hosts = $this->getBackend()->fetchHosts(
                $rd->getParameter('query', '%'),
                $rd->getParameter('start', 0),
                $rd->getParameter('limit', 20)
            );
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('hosts', $hosts);
        return $this->getDefaultViewName();
    }
}
